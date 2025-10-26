import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { jd_text } = (body ?? {}) as { jd_text?: unknown };
    if (typeof jd_text !== "string" || jd_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Job description text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sanitizedJdText = jd_text.trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content:
              `Analyze this job description and return the structured data as JSON.\n\n${sanitizedJdText}`,
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

    let structuredResult: unknown;
    try {
      structuredResult = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI JSON payload:", rawContent);
      throw new Error("AI response was not valid JSON");
    }

    return new Response(
      JSON.stringify(structuredResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in fn_generate_role_definition:", error);

    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
