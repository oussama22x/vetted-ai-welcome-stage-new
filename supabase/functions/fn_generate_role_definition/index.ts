import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert Hiring Strategist trained in the VettedAI Proof-of-Work Model (v2.0).
Your only job is to parse any Job Description (JD) and extract:
1.  The "9 Essentials of a Role".
2.  The "Context Flags" needed to select dimensions.
3.  "Clarifier Questions" for any gaps.

Always call the extract_role_data function with properly structured arguments. Do not include markdown or code fences in any values.

JSON Schema: { "definition_data": { "goals": "...", "stakeholders": "...", "decision_horizon": "...", "tools": "...", "kpis": "...", "constraints": "...", "cognitive_type": "Analytical" | "Creative" | "Procedural" | "Not specified", "team_topology": "Solo" | "Cross-functional" | "Not specified", "cultural_tone": "..." }, "context_flags": { "role_family": "Product Mgmt" | "Engineering" | "Sales" | "Operations" | "Design / UX" | "Compliance / Risk" | "Finance" | "Marketing" | "Human Resources" | "Customer Support" | "Leadership / Strat" | "Growth PM" | "RevOps" | "UX Research" | "Other", "seniority": "Junior" | "Senior" | "Manager" | "Not specified", "is_startup_context": true | false, "is_people_management": true | false }, "clarifier_questions": [ "Who is the primary audience for their deliverables?" ] }

Instructions:
Fill every field. Use "Not specified" if no information is found.
For role_family, choose the closest match from the list.
For is_startup_context, set to true if the JD mentions "fast-paced," "scrappy," "0-to-1," or is a startup.
For is_people_management, set to true if the JD mentions "managing," "leading a team," or "direct reports."
Only add clarifier questions if essentials are truly missing.`;

type RoleDefinitionPayload = {
  jd_text?: unknown;
};

type RoleDefinitionResult = {
  definition_data: {
    goals: string;
    stakeholders: string;
    decision_horizon: string;
    tools: string;
    kpis: string;
    constraints: string;
    cognitive_type: "Analytical" | "Creative" | "Procedural" | "Not specified";
    team_topology: "Solo" | "Cross-functional" | "Not specified";
    cultural_tone: string;
  };
  context_flags: {
    role_family:
      | "Product Mgmt"
      | "Engineering"
      | "Sales"
      | "Operations"
      | "Design / UX"
      | "Compliance / Risk"
      | "Finance"
      | "Marketing"
      | "Human Resources"
      | "Customer Support"
      | "Leadership / Strat"
      | "Growth PM"
      | "RevOps"
      | "UX Research"
      | "Other";
    seniority: "Junior" | "Senior" | "Manager" | "Not specified";
    is_startup_context: boolean;
    is_people_management: boolean;
  };
  clarifier_questions: string[];
};

type AiGatewayResponse = {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
};

function coerceJson<T>(raw: string): T {
  let cleaned = raw.trim();
  
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Fallback: extract innermost {...}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }
  
  return JSON.parse(cleaned) as T;
}

function buildErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureAuthenticatedUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

async function callAiGateway(jdText: string): Promise<RoleDefinitionResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  console.log("Using NEW v2 system prompt.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this job description and return the structured data as JSON.\n\n${jdText}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_role_data",
            description: "Extract structured role definition data using the VettedAI Proof-of-Work Model.",
            parameters: {
              type: "object",
              properties: {
                definition_data: {
                  type: "object",
                  properties: {
                    goals: { type: "string", description: "Top 2-3 objectives for the role." },
                    stakeholders: {
                      type: "string",
                      description: "Key stakeholders and collaborators for this role.",
                    },
                    decision_horizon: {
                      type: "string",
                      description: "How far ahead the role typically makes decisions.",
                    },
                    tools: { type: "string", description: "Primary tools or platforms mentioned." },
                    kpis: { type: "string", description: "KPIs or success metrics used." },
                    constraints: {
                      type: "string",
                      description: "Major constraints or guardrails impacting the role.",
                    },
                    cognitive_type: {
                      type: "string",
                      enum: ["Analytical", "Creative", "Procedural", "Not specified"],
                      description: "Dominant cognitive demand of the role.",
                    },
                    team_topology: {
                      type: "string",
                      enum: ["Solo", "Cross-functional", "Not specified"],
                      description: "Team structure or collaboration model.",
                    },
                    cultural_tone: {
                      type: "string",
                      description: "Notable cultural tone or working style cues.",
                    },
                  },
                  required: [
                    "goals",
                    "stakeholders",
                    "decision_horizon",
                    "tools",
                    "kpis",
                    "constraints",
                    "cognitive_type",
                    "team_topology",
                    "cultural_tone",
                  ],
                  additionalProperties: false,
                },
                context_flags: {
                  type: "object",
                  properties: {
                    role_family: {
                      type: "string",
                      enum: [
                        "Product Mgmt",
                        "Engineering",
                        "Sales",
                        "Operations",
                        "Design / UX",
                        "Compliance / Risk",
                        "Finance",
                        "Marketing",
                        "Human Resources",
                        "Customer Support",
                        "Leadership / Strat",
                        "Growth PM",
                        "RevOps",
                        "UX Research",
                        "Other",
                      ],
                      description: "Role family classification based on responsibilities.",
                    },
                    seniority: {
                      type: "string",
                      enum: ["Junior", "Senior", "Manager", "Not specified"],
                      description: "Seniority level inferred from the JD.",
                    },
                    is_startup_context: {
                      type: "boolean",
                      description: "Whether the JD signals a startup or 0-to-1 environment.",
                    },
                    is_people_management: {
                      type: "boolean",
                      description: "Whether the role requires managing people or direct reports.",
                    },
                  },
                  required: [
                    "role_family",
                    "seniority",
                    "is_startup_context",
                    "is_people_management",
                  ],
                  additionalProperties: false,
                },
                clarifier_questions: {
                  type: "array",
                  description: "Follow-up clarifier questions needed to complete missing essentials.",
                  items: {
                    type: "string",
                    description: "Single clarifier question addressing a missing data point.",
                  },
                },
              },
              required: ["definition_data", "context_flags", "clarifier_questions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_role_data" } },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("AI gateway error:", response.status, details);

    if (response.status === 429) {
      throw Object.assign(new Error("Rate limit exceeded. Please try again later."), { status: 429 });
    }

    if (response.status === 402) {
      throw Object.assign(new Error("Payment required. Please add credits to your workspace."), { status: 402 });
    }

    throw new Error(`AI gateway error: ${response.status}`);
  }

  const payload = (await response.json()) as AiGatewayResponse;
  const toolCall = payload?.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.function?.name !== "extract_role_data") {
    throw new Error("AI did not return expected tool call");
  }

  const args = toolCall.function.arguments;

  if (!args) {
    throw new Error("AI response did not include tool call arguments");
  }

  try {
    return JSON.parse(args) as RoleDefinitionResult;
  } catch (error) {
    console.error("Failed to parse AI tool call arguments:", args);
    throw new Error("AI response was not valid JSON");
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return buildErrorResponse("Method not allowed", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    await ensureAuthenticatedUser(authHeader);

    let body: RoleDefinitionPayload;
    try {
      body = (await req.json()) as RoleDefinitionPayload;
    } catch {
      return buildErrorResponse("Invalid JSON payload", 400);
    }

    const { jd_text } = body ?? {};
    if (typeof jd_text !== "string" || jd_text.trim().length === 0) {
      return buildErrorResponse("Job description text is required", 400);
    }

    const result = await callAiGateway(jd_text.trim());

    console.log("Function execution complete.");
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error instanceof Error && typeof (error as any).status === "number"
      ? (error as any).status
      : 500;
    const message = error instanceof Error ? error.message : "Unexpected error";

    if (status === 500) {
      console.error("Error in fn_generate_role_definition:", error);
    }

    return buildErrorResponse(message, status);
  }
});
