import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust if needed for security
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("fn_notify_sourcing_request function booting up.");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Note: In a real webhook trigger, Supabase passes event data in the body.
    // Here, we'll simulate getting project info. Adapt later if using DB webhooks.
    const payload = await req.json();
    const projectId = payload?.record?.id || payload?.id || 'Unknown Project ID';
    const roleTitle = payload?.record?.role_title || payload?.role_title || 'Unknown Role';

    console.log(`Received sourcing request notification trigger for Project ID: ${projectId}, Role: ${roleTitle}`);

    const slackWebhookUrl = Deno.env.get("SLACK_SOURCING_WEBHOOK_URL");
    if (!slackWebhookUrl) {
      console.error("SLACK_SOURCING_WEBHOOK_URL secret is not set.");
      throw new Error("Slack webhook URL is not configured.");
    }

    const message = {
      text: `🚀 New Sourcing Request!\nProject ID: ${projectId}\nRole: ${roleTitle}\nPlease check the VettedAI dashboard.`,
    };

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error sending Slack notification: ${response.status} ${errorBody}`);
      throw new Error(`Failed to send Slack notification: ${response.status}`);
    }

    console.log("Slack notification sent successfully.");

    return new Response(JSON.stringify({ success: true, message: "Notification sent." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in fn_notify_sourcing_request:", error);

    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal Server Error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
