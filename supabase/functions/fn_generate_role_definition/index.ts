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
Output Format: You must return only a valid JSON object.

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

type AiGatewayResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
};

function buildErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthenticatedClient(authHeader: string | null) {
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

  return client;
}

async function callAiGateway(jdText: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

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
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI response did not include any content");
  }

  const raw = Array.isArray(content)
    ? content
        .map((part) => (typeof part === "string" ? part : part?.text ?? ""))
        .join("")
        .trim()
    : content.trim();

  if (!raw) {
    throw new Error("AI response was empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse AI JSON payload:", raw);
    throw new Error("AI response was not valid JSON");
  }

  return parsed;
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
    await getAuthenticatedClient(authHeader);

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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error instanceof Error && typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : "Unexpected error";

    if (status === 500) {
      console.error("Error in fn_generate_role_definition:", error);
    }

    return buildErrorResponse(message, status);
  }
});
