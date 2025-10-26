import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

type Dimension =
  | "Cognitive"
  | "Execution"
  | "Communication"
  | "Emotional Intelligence"
  | "Adaptability"
  | "Judgment";

type DefinitionData = Record<string, unknown>;

type ContextFlags = {
  role_family: string;
  seniority: string;
  is_startup_context: boolean;
  is_people_management: boolean;
};

type ClarifierAnswers = Record<string, unknown>;

type AiScaffoldResponse = {
  scaffold_data?: {
    objective?: unknown;
    context_frame?: unknown;
    inputs?: unknown;
    constraint_dials?: unknown;
    chosen_dimensions?: unknown;
    dimension_justification?: unknown;
    mechanics?: unknown;
  };
  scaffold_preview_html?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert Audition Designer, bound by the VettedAI Proof-of-Work Model.
Your job is to take a "Role Definition" and "Context Flags" and generate a "Proof Scaffold" and "Candidate Preview".

INPUTS:
Role Definition (Refined): {{refined_definition_data}}

Context Flags: {{context_flags}}

STEP 1: Select Dimensions (Your Core Logic)
You must follow this logic to select 3-4 dimensions:

Dimension Lookup Table:
Product Mgmt: Cognitive, Execution, Communication
Design / UX: Cognitive, Communication, Adaptability
Sales: Communication, Emotional Intelligence, Execution
Operations: Execution, Cognitive, Adaptability
Compliance / Risk: Judgment, Execution, Communication
Engineering / Tech: Cognitive, Execution, Judgment
Finance: Cognitive, Judgment, Execution
Marketing: Communication, Cognitive, Adaptability
Human Resources: Emotional Intelligence, Communication, Judgment
Customer Support: Communication, Emotional Intelligence, Execution
Leadership / Strat: Judgment, Communication, Cognitive
Growth PM: Cognitive, Execution, Communication
RevOps: Execution, Cognitive, Adaptability
UX Research: Cognitive, Communication, Emotional Intelligence
Logic (in pseudocode):
base = lookup(context_flags.role_family)
if context_flags.seniority == "Senior" or "Manager": base.add("Judgment")
if context_flags.is_startup_context == true: base.add("Adaptability")
if context_flags.is_people_management == true: base.add("Emotional Intelligence")
final_dimensions = deduplicate(base)
dimension_justification = "Based on the role, we are prioritizing [list base dimensions]. We added [modifier] due to [context flag]."
Ensure at least two of the final dimensions are "high-observability" (Cognitive, Communication, or Execution).
STEP 2: Generate Scaffold
Using the final_dimensions and the Role Definition, generate the scaffold.

STEP 3: Format Output
Return only a valid JSON object in this exact format:

JSON
{
  "scaffold_data": {
    "objective": "...",
    "context_frame": "...",
    "inputs": ["...", "..."],
    "constraint_dials": {
      "time_limit_min": 25,
      "ai_tokens": 3
    },
    "chosen_dimensions": ["Dimension 1", "Dimension 2", "Dimension 3"],
    "dimension_justification": "Based on [Role Family], we are prioritizing [Dimension 1, 2, 3]. We also added [Dimension 4] because the role is [Senior/Startup/etc.].",
    "mechanics": ["...", "..."]
  },
  "scaffold_preview_html": "<h3>Your Audition Preview</h3><p><b>Context:</b> ...</p><p><b>Task:</b> ...</p>"
}`;

const ROLE_DIMENSION_LOOKUP: Record<string, Dimension[]> = {
  "Product Mgmt": ["Cognitive", "Execution", "Communication"],
  "Design / UX": ["Cognitive", "Communication", "Adaptability"],
  Sales: ["Communication", "Emotional Intelligence", "Execution"],
  Operations: ["Execution", "Cognitive", "Adaptability"],
  "Compliance / Risk": ["Judgment", "Execution", "Communication"],
  "Engineering / Tech": ["Cognitive", "Execution", "Judgment"],
  Finance: ["Cognitive", "Judgment", "Execution"],
  Marketing: ["Communication", "Cognitive", "Adaptability"],
  "Human Resources": ["Emotional Intelligence", "Communication", "Judgment"],
  "Customer Support": ["Communication", "Emotional Intelligence", "Execution"],
  "Leadership / Strat": ["Judgment", "Communication", "Cognitive"],
  "Growth PM": ["Cognitive", "Execution", "Communication"],
  RevOps: ["Execution", "Cognitive", "Adaptability"],
  "UX Research": ["Cognitive", "Communication", "Emotional Intelligence"],
};

const HIGH_OBSERVABILITY_DIMENSIONS = new Set<Dimension>([
  "Cognitive",
  "Communication",
  "Execution",
]);

const DEFAULT_BASE_DIMENSIONS: Dimension[] = [
  "Cognitive",
  "Execution",
  "Communication",
];

function dedupeDimensions(dimensions: Dimension[]): Dimension[] {
  const seen = new Set<Dimension>();
  const result: Dimension[] = [];
  for (const dimension of dimensions) {
    if (!seen.has(dimension)) {
      seen.add(dimension);
      result.push(dimension);
    }
  }
  return result;
}

function countHighObservability(dimensions: Dimension[]): number {
  return dimensions.filter((dim) => HIGH_OBSERVABILITY_DIMENSIONS.has(dim)).length;
}

function ensureHighObservability(dimensions: Dimension[]): Dimension[] {
  const result = [...dimensions];
  for (const dimension of DEFAULT_BASE_DIMENSIONS) {
    if (countHighObservability(result) >= 2) {
      break;
    }
    if (!result.includes(dimension)) {
      result.push(dimension);
    }
  }
  return dedupeDimensions(result);
}

function ensureMinimumDimensions(dimensions: Dimension[]): Dimension[] {
  const result = [...dimensions];
  const fallbackOrder: Dimension[] = [
    "Cognitive",
    "Execution",
    "Communication",
    "Judgment",
    "Adaptability",
    "Emotional Intelligence",
  ];
  for (const dimension of fallbackOrder) {
    if (result.length >= 3) {
      break;
    }
    if (!result.includes(dimension)) {
      result.push(dimension);
    }
  }
  return dedupeDimensions(result);
}

function trimToMaximum(dimensions: Dimension[]): Dimension[] {
  let result = [...dimensions];
  if (result.length <= 4) {
    return result;
  }

  // Attempt to drop non high-observability dimensions first while preserving order importance.
  while (result.length > 4) {
    const removableIndex = result.findLastIndex((dim) => !HIGH_OBSERVABILITY_DIMENSIONS.has(dim));
    if (removableIndex !== -1 && result.length > 4) {
      result.splice(removableIndex, 1);
    } else {
      result.pop();
    }
  }

  // Ensure we still have at least two high observability dimensions after trimming.
  if (countHighObservability(result) < 2) {
    for (const dimension of DEFAULT_BASE_DIMENSIONS) {
      if (result.includes(dimension)) {
        continue;
      }
      if (result.length >= 4) {
        const replacementIndex = result.findIndex((dim) => !HIGH_OBSERVABILITY_DIMENSIONS.has(dim));
        if (replacementIndex !== -1) {
          result[replacementIndex] = dimension;
        }
      } else {
        result.push(dimension);
      }
      result = dedupeDimensions(result);
      if (countHighObservability(result) >= 2) {
        break;
      }
    }
  }

  return dedupeDimensions(result);
}

function selectDimensions(contextFlags: ContextFlags) {
  const baseDimensions = ROLE_DIMENSION_LOOKUP[contextFlags.role_family] ?? DEFAULT_BASE_DIMENSIONS;

  const modifiers: string[] = [];
  const expanded: Dimension[] = [...baseDimensions];

  if (["Senior", "Manager"].includes(contextFlags.seniority)) {
    expanded.push("Judgment");
    modifiers.push("Judgment because the role is senior");
  }

  if (contextFlags.is_startup_context) {
    expanded.push("Adaptability");
    modifiers.push("Adaptability for the startup context");
  }

  if (contextFlags.is_people_management) {
    expanded.push("Emotional Intelligence");
    modifiers.push("Emotional Intelligence to reflect people leadership");
  }

  let finalDimensions = dedupeDimensions(expanded);
  finalDimensions = ensureHighObservability(finalDimensions);
  finalDimensions = ensureMinimumDimensions(finalDimensions);
  finalDimensions = trimToMaximum(finalDimensions);

  if (countHighObservability(finalDimensions) < 2) {
    finalDimensions = ensureHighObservability(finalDimensions);
    finalDimensions = trimToMaximum(finalDimensions);
  }

  const justificationBase = `Based on the ${contextFlags.role_family || "role"} role family, we are prioritizing ${
    (ROLE_DIMENSION_LOOKUP[contextFlags.role_family] ?? DEFAULT_BASE_DIMENSIONS).join(", ")
  }.`;

  const justificationModifiers = modifiers.length
    ? ` We added ${modifiers.join(" and ")}.`
    : "";

  return {
    finalDimensions,
    dimensionJustification: `${justificationBase}${justificationModifiers}`,
  };
}

function normalizeContextFlags(raw: unknown): ContextFlags {
  const fallback: ContextFlags = {
    role_family: "Other",
    seniority: "Not specified",
    is_startup_context: false,
    is_people_management: false,
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fallback;
  }

  const value = raw as Record<string, unknown>;

  return {
    role_family: typeof value.role_family === "string" && value.role_family.trim().length > 0
      ? value.role_family
      : fallback.role_family,
    seniority: typeof value.seniority === "string" && value.seniority.trim().length > 0
      ? value.seniority
      : fallback.seniority,
    is_startup_context: typeof value.is_startup_context === "boolean"
      ? value.is_startup_context
      : fallback.is_startup_context,
    is_people_management: typeof value.is_people_management === "boolean"
      ? value.is_people_management
      : fallback.is_people_management,
  };
}

function mergeClarifierAnswers(definition: DefinitionData, clarifierAnswers: ClarifierAnswers | undefined) {
  if (!clarifierAnswers || typeof clarifierAnswers !== "object" || Array.isArray(clarifierAnswers)) {
    return definition;
  }

  const refined = { ...definition } as Record<string, unknown>;
  for (const [key, value] of Object.entries(clarifierAnswers)) {
    if (typeof key !== "string") continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      if (value.trim().length === 0) continue;
      refined[key] = value.trim();
      continue;
    }
    refined[key] = value;
  }
  return refined;
}

function validateDefinitionData(raw: unknown): DefinitionData | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return raw as DefinitionData;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = payload as {
      definition_data?: unknown;
      context_flags?: unknown;
      clarifier_answers?: ClarifierAnswers;
    };

    const definitionData = validateDefinitionData(body.definition_data);
    if (!definitionData) {
      return new Response(
        JSON.stringify({ error: "definition_data must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contextFlags = normalizeContextFlags(body.context_flags);
    const refinedDefinition = mergeClarifierAnswers(definitionData, body.clarifier_answers);
    const { finalDimensions, dimensionJustification } = selectDimensions(contextFlags);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = `Use the provided data to generate an audition scaffold.\n\nRole Definition (Refined):\n${
      JSON.stringify(refinedDefinition, null, 2)
    }\n\nContext Flags:\n${JSON.stringify(contextFlags, null, 2)}\n\nPre-selected Dimensions (apply these exactly):\n${
      JSON.stringify(finalDimensions)
    }\n\nDimension Justification Guidance:\n${dimensionJustification}\n\nClarifier Answers (if any):\n${
      JSON.stringify(body.clarifier_answers ?? {}, null, 2)
    }\n\nReturn only JSON as described in the system prompt.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // fast + cost effective
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const completion = await aiResponse.json();
    const aiMessage = completion?.choices?.[0]?.message?.content;

    let rawContent = "";
    if (typeof aiMessage === "string") {
      rawContent = aiMessage.trim();
    } else if (Array.isArray(aiMessage)) {
      rawContent = aiMessage
        .map((part: { text?: string } | string) => {
          if (typeof part === "string") {
            return part;
          }
          if (part && typeof part.text === "string") {
            return part.text;
          }
          return "";
        })
        .join("")
        .trim();
    }

    if (!rawContent) {
      throw new Error("AI response did not include any content");
    }

    let structuredResult: AiScaffoldResponse;
    try {
      structuredResult = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI JSON payload:", rawContent);
      throw new Error("AI response was not valid JSON");
    }

    if (!structuredResult || typeof structuredResult !== "object") {
      throw new Error("AI response payload was empty");
    }

    if (!structuredResult.scaffold_data || typeof structuredResult.scaffold_data !== "object") {
      throw new Error("AI response is missing scaffold_data");
    }

    const scaffoldData = { ...structuredResult.scaffold_data } as Record<string, unknown>;
    scaffoldData.chosen_dimensions = finalDimensions;
    scaffoldData.dimension_justification = dimensionJustification;

    const responseBody = {
      scaffold_data: scaffoldData,
      scaffold_preview_html: structuredResult.scaffold_preview_html ?? "",
    };

    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in fn_generate_audition_scaffold:", error);

    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
