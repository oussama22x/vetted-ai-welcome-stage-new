import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPE = "text/csv";
const STORAGE_BUCKET = "resumes";

function sanitizeFilename(filename: string): string {
  const baseName = filename.split(/[\\/]/).pop() ?? "shortlist.csv";
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const trimmed = sanitized.replace(/^_+/, "").replace(/_+$/, "");
  const withoutDots = trimmed.replace(/\.\.+/g, ".");
  const finalName = withoutDots.length > 0 ? withoutDots : "shortlist.csv";
  return finalName.endsWith(".csv") ? finalName : `${finalName}.csv`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Failed to load user roles", rolesError);
      throw new Error("Unable to verify user role");
    }

    const isRecruiter = Array.isArray(roles) && roles.some((role) => role.role === "recruiter");
    if (!isRecruiter) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const projectId = formData.get("project_id");
    const file = formData.get("file");

    if (typeof projectId !== "string" || projectId.trim().length === 0) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "A CSV file must be provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.type !== ALLOWED_MIME_TYPE) {
      return new Response(JSON.stringify({ error: "Only text/csv files are allowed" }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "File exceeds 5MB limit" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, recruiter:recruiters(user_id)")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      console.error("Failed to load project", projectError);
      throw new Error("Unable to verify project access");
    }

    const recruiterRecord = Array.isArray(project?.recruiter)
      ? project.recruiter[0]
      : project?.recruiter ?? null;

    if (!project || !recruiterRecord || recruiterRecord.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedOriginalName = sanitizeFilename(file.name || "shortlist.csv");
    const filePath = `${projectId}/shortlist_${Date.now()}_${sanitizedOriginalName}`;
    const fileBuffer = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: ALLOWED_MIME_TYPE,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed", uploadError);
      throw new Error("Failed to upload shortlist file");
    }

    return new Response(
      JSON.stringify({ file_path: filePath, sanitized_name: sanitizedOriginalName }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("secure-shortlist-upload error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
