import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert Hiring Strategist trained in the VettedAI Proof-of-Work Model (v2.0).
Your job is to parse any Job Description (JD) and extract:
1. The "9 Essentials of a Role".
2. The "Context Flags" (role_family, seniority, is_startup_context, is_people_management).
3. The "Clarifier Inputs" (6 boolean triggers for dimension weighting).
4. "Clarifier Questions" for any gaps.

Always call the extract_role_data function with properly structured arguments. Do not include markdown or code fences.

JSON Schema: { "definition_data": {...}, "context_flags": {...}, "clarifier_inputs": {...}, "clarifier_questions": [...] }

Instructions:
- Fill every field. Use "Not specified" if no information is found.
- For role_family, choose the closest match from the list.
- For is_startup_context, set to true if the JD mentions "fast-paced," "scrappy," "0-to-1," or is a startup.
- For is_people_management, set to true if the JD mentions "managing," "leading a team," or "direct reports."
- For clarifier_inputs, analyze the JD carefully:
  * ambiguity: true if role involves undefined problems, exploratory work, or "figure it out" scenarios
  * time_pressure: true if JD mentions fast-paced, urgent, time-sensitive, quick turnaround
  * cross_functional: true if role collaborates with multiple teams or stakeholders
  * customer_facing: true if role directly interacts with customers, clients, or end-users
  * regulated: true if JD mentions compliance, regulatory, audit, legal, GDPR, HIPAA, SOC2, etc.
  * analytical_data_heavy: true if role requires data analysis, SQL, metrics, dashboards, analytics
- Only add clarifier questions if essentials are truly missing.`;

type RoleDefinitionPayload = {
  jd_text?: unknown;
};

type ClarifierInputs = {
  ambiguity: boolean;
  time_pressure: boolean;
  cross_functional: boolean;
  customer_facing: boolean;
  regulated: boolean;
  analytical_data_heavy: boolean;
};

type DimensionWeights = {
  cognitive: number;
  execution: number;
  communication_collaboration: number;
  adaptability_learning: number;
  emotional_intelligence: number;
  judgment_ethics: number;
};

type WeightingResult = {
  weights: DimensionWeights;
  rationale: string;
  bank_id: string;
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
  clarifier_inputs: ClarifierInputs;
  weighted_dimensions: WeightingResult;
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

function getBaseWeights(roleFamily: string, isRegulated: boolean): DimensionWeights {
  // Map role_family to base profile
  const baseProfiles: Record<string, DimensionWeights> = {
    'ops_executional': {
      cognitive: 0.20,
      execution: 0.30,
      communication_collaboration: 0.20,
      adaptability_learning: 0.15,
      emotional_intelligence: 0.10,
      judgment_ethics: 0.05
    },
    'product_strategy': {
      cognitive: 0.25,
      execution: 0.20,
      communication_collaboration: 0.20,
      adaptability_learning: 0.15,
      emotional_intelligence: 0.10,
      judgment_ethics: 0.10
    },
    'sales_customer': {
      cognitive: 0.15,
      execution: 0.15,
      communication_collaboration: 0.25,
      adaptability_learning: 0.10,
      emotional_intelligence: 0.25,
      judgment_ethics: 0.10
    },
    'creative_marketing': {
      cognitive: 0.20,
      execution: 0.15,
      communication_collaboration: 0.20,
      adaptability_learning: 0.25,
      emotional_intelligence: 0.15,
      judgment_ethics: 0.05
    },
    'finance_data': {
      cognitive: 0.30,
      execution: 0.25,
      communication_collaboration: 0.15,
      adaptability_learning: 0.10,
      emotional_intelligence: 0.10,
      judgment_ethics: 0.10
    },
    'leadership_compliance': {
      cognitive: 0.20,
      execution: 0.15,
      communication_collaboration: 0.15,
      adaptability_learning: 0.10,
      emotional_intelligence: 0.10,
      judgment_ethics: 0.30
    }
  };
  
  // Map specific role families to base profiles
  const roleFamilyMap: Record<string, string> = {
    'Operations': 'ops_executional',
    'Customer Support': 'ops_executional',
    'RevOps': 'ops_executional',
    'Product Mgmt': 'product_strategy',
    'Growth PM': 'product_strategy',
    'UX Research': 'product_strategy',
    'Sales': 'sales_customer',
    'Marketing': 'sales_customer',
    'Design / UX': 'creative_marketing',
    'Finance': 'finance_data',
    'Engineering': 'finance_data',
    'Leadership / Strat': 'leadership_compliance',
    'Compliance / Risk': 'leadership_compliance',
    'Human Resources': 'leadership_compliance',
    'Other': 'product_strategy'
  };
  
  const profileKey = roleFamilyMap[roleFamily] || 'product_strategy';
  const weights = { ...baseProfiles[profileKey] };
  
  // Special rule: Boost Judgment if regulated
  if (isRegulated && weights.judgment_ethics < 0.30) {
    const boost = 0.25;
    weights.judgment_ethics = 0.30;
    // Reduce other dimensions proportionally
    const reductionPerDim = boost / 5;
    weights.cognitive -= reductionPerDim;
    weights.execution -= reductionPerDim;
    weights.communication_collaboration -= reductionPerDim;
    weights.adaptability_learning -= reductionPerDim;
    weights.emotional_intelligence -= reductionPerDim;
  }
  
  return weights;
}

function applyModifiers(
  baseWeights: DimensionWeights,
  clarifierInputs: ClarifierInputs
): DimensionWeights {
  const modifiers: Array<[keyof ClarifierInputs, keyof DimensionWeights]> = [
    ['ambiguity', 'adaptability_learning'],
    ['cross_functional', 'communication_collaboration'],
    ['time_pressure', 'execution'],
    ['customer_facing', 'emotional_intelligence'],
    ['regulated', 'judgment_ethics'],
    ['analytical_data_heavy', 'cognitive']
  ];
  
  const weights = { ...baseWeights };
  const adjustments: Partial<Record<keyof DimensionWeights, number>> = {};
  
  // Track which dimensions received boosts
  for (const [trigger, dimension] of modifiers) {
    if (clarifierInputs[trigger]) {
      adjustments[dimension] = (adjustments[dimension] || 0) + 0.05;
    }
  }
  
  // Cap adjustments at +0.07 per dimension
  for (const dim in adjustments) {
    adjustments[dim as keyof DimensionWeights] = Math.min(
      adjustments[dim as keyof DimensionWeights]!,
      0.07
    );
  }
  
  // Apply adjustments
  for (const dim in adjustments) {
    weights[dim as keyof DimensionWeights] += adjustments[dim as keyof DimensionWeights]!;
  }
  
  return weights;
}

function normalizeWeights(weights: DimensionWeights): DimensionWeights {
  const normalized = { ...weights };
  
  // Enforce bounds: 0.10 ≤ weight ≤ 0.35
  for (const dim in normalized) {
    normalized[dim as keyof DimensionWeights] = Math.max(
      0.10,
      Math.min(0.35, normalized[dim as keyof DimensionWeights])
    );
  }
  
  // Normalize to sum = 1.00
  const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
  for (const dim in normalized) {
    normalized[dim as keyof DimensionWeights] = 
      normalized[dim as keyof DimensionWeights] / sum;
  }
  
  // Round to 2 decimal places
  for (const dim in normalized) {
    normalized[dim as keyof DimensionWeights] = 
      Math.round(normalized[dim as keyof DimensionWeights] * 100) / 100;
  }
  
  return normalized;
}

function generateRationale(clarifierInputs: ClarifierInputs): string {
  const reasons: string[] = [];
  
  if (clarifierInputs.time_pressure) reasons.push("Execution ↑ (time-sensitive)");
  if (clarifierInputs.cross_functional) reasons.push("Comm/Collab ↑ (cross-functional)");
  if (clarifierInputs.customer_facing) reasons.push("EI ↑ (customer-facing)");
  if (clarifierInputs.ambiguity) reasons.push("Adapt/Learn ↑ (high ambiguity)");
  if (clarifierInputs.regulated) reasons.push("Judgment ↑ (regulated environment)");
  if (clarifierInputs.analytical_data_heavy) reasons.push("Cognitive ↑ (data-heavy)");
  
  return reasons.length > 0 ? reasons.join(", ") : "Base weights applied (no contextual modifiers)";
}

function generateBankId(contextFlags: RoleDefinitionResult['context_flags']): string {
  // Normalize role family name (remove spaces and special characters)
  const normalizedFamily = contextFlags.role_family.replace(/\s+/g, '').replace(/\//g, '');
  
  let bankId = `${normalizedFamily}-${contextFlags.seniority}`;
  
  if (contextFlags.is_startup_context) {
    bankId += '-Startup';
  }
  
  if (contextFlags.is_people_management) {
    bankId += '-Leadership';
  }
  
  return bankId;
}

function computeWeightedDimensions(
  roleFamily: string,
  seniority: string,
  clarifierInputs: ClarifierInputs,
  contextFlags: RoleDefinitionResult['context_flags']
): WeightingResult {
  
  // PASS 1: Base Preset Weights
  const baseWeights = getBaseWeights(roleFamily, clarifierInputs.regulated);
  
  // PASS 2: Apply Contextual Modifiers
  let modifiedWeights = applyModifiers(baseWeights, clarifierInputs);
  
  // PASS 3: Normalize & Cap
  const finalWeights = normalizeWeights(modifiedWeights);
  
  // Generate Rationale String
  const rationale = generateRationale(clarifierInputs);
  
  // Generate Bank ID (Fingerprint)
  const bank_id = generateBankId(contextFlags);
  
  return {
    weights: finalWeights,
    rationale,
    bank_id
  };
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

  console.log("Using v2.0 system prompt with clarifier inputs.");

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
                clarifier_inputs: {
                  type: "object",
                  properties: {
                    ambiguity: {
                      type: "boolean",
                      description: "Whether role involves undefined problems or exploratory 'figure it out' work."
                    },
                    time_pressure: {
                      type: "boolean",
                      description: "Whether role operates under urgency, fast-paced, or time-sensitive conditions."
                    },
                    cross_functional: {
                      type: "boolean",
                      description: "Whether role requires collaboration across multiple teams or departments."
                    },
                    customer_facing: {
                      type: "boolean",
                      description: "Whether role directly interacts with customers, clients, or end-users."
                    },
                    regulated: {
                      type: "boolean",
                      description: "Whether role operates in a regulated environment (compliance, legal, audit)."
                    },
                    analytical_data_heavy: {
                      type: "boolean",
                      description: "Whether role requires heavy data analysis, SQL, metrics, or dashboards."
                    }
                  },
                  required: [
                    "ambiguity",
                    "time_pressure",
                    "cross_functional",
                    "customer_facing",
                    "regulated",
                    "analytical_data_heavy"
                  ],
                  additionalProperties: false
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
              required: ["definition_data", "context_flags", "clarifier_inputs", "clarifier_questions"],
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

  let aiResult: Omit<RoleDefinitionResult, 'weighted_dimensions'>;
  try {
    aiResult = JSON.parse(args);
  } catch (error) {
    console.error("Failed to parse AI tool call arguments:", args);
    throw new Error("AI response was not valid JSON");
  }

  // COMPUTE WEIGHTED DIMENSIONS (new post-processing step)
  const weightingResult = computeWeightedDimensions(
    aiResult.context_flags.role_family,
    aiResult.context_flags.seniority,
    aiResult.clarifier_inputs,
    aiResult.context_flags
  );

  console.log("✅ Weighted dimensions computed:", weightingResult);

  // Inject computed weights into result
  return {
    ...aiResult,
    weighted_dimensions: weightingResult
  };
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
    console.log("🔐 Authenticating request...");
    await ensureAuthenticatedUser(authHeader);
    console.log("✅ Authentication successful");

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
