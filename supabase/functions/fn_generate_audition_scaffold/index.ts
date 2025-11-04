import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RoleDefinitionData = {
  goals: string;
  stakeholders: string;
  decision_horizon: string;
  tools: string;
  kpis: string;
  constraints: string;
  cognitive_type: string;
  team_topology: string;
  cultural_tone: string;
};

type ContextFlags = {
  role_family: string;
  seniority: string;
  is_startup_context: boolean;
  is_people_management: boolean;
};

type ClarifierInputs = {
  ambiguity: number;
  time_pressure: number;
  cross_functional: number;
  customer_facing: number;
  regulated: number;
  analytical_data_heavy: number;
};

type WeightedDimensions = {
  weights: {
    cognitive: number;
    execution: number;
    communication_collaboration: number;
    adaptability_learning: number;
    emotional_intelligence: number;
    judgment_ethics: number;
  };
  rationale: string;
  bank_id: string;
};

type FinalRoleDefinition = {
  definition_data: RoleDefinitionData;
  context_flags: ContextFlags;
  clarifier_inputs: ClarifierInputs;
  weighted_dimensions: WeightedDimensions;
};

type QuestionObject = {
  question_id: string;
  dimension: string;
  archetype_id: string;
  question_text: string;
  context_used: Record<string, unknown>;
  quality_score: number;
  generated_at: string;
};

type RoleMasterBank = {
  bank_id: string;
  status: 'GENERATING' | 'READY' | 'FAILED';
  questions: QuestionObject[];
  role_family: string;
  seniority_level: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get or generate role definition for a project
 */
async function getOrGenerateRoleDefinition(
  supabase: any,
  projectId: string
): Promise<FinalRoleDefinition> {
  console.log(`📋 Fetching role definition for project: ${projectId}`);
  
  // Check if role definition already exists
  const { data: existingDef, error: fetchError } = await supabase
    .from('role_definitions')
    .select('definition_data')
    .eq('project_id', projectId)
    .maybeSingle();
  
  if (fetchError) {
    throw new Error(`Failed to fetch role definition: ${fetchError.message}`);
  }
  
  if (existingDef && existingDef.definition_data) {
    console.log('✅ Found existing role definition');
    return existingDef.definition_data as FinalRoleDefinition;
  }
  
  // Generate new role definition
  console.log('🔄 Generating new role definition...');
  
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('job_description, company_name')
    .eq('id', projectId)
    .single();
  
  if (projectError || !project) {
    throw new Error('Project not found');
  }
  
  // Call fn_generate_role_definition
  const authHeader = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const { data: roleDefData, error: roleDefError } = await supabase.functions.invoke(
    'fn_generate_role_definition',
    {
      body: {
        job_description: project.job_description,
        company_name: project.company_name || undefined
      },
      headers: {
        Authorization: `Bearer ${authHeader}`
      }
    }
  );
  
  if (roleDefError) {
    throw new Error(`Failed to generate role definition: ${roleDefError.message}`);
  }
  
  if (!roleDefData?.definition_data) {
    throw new Error('Invalid role definition response');
  }
  
  // Save to database
  const { error: saveError } = await supabase
    .from('role_definitions')
    .insert({
      project_id: projectId,
      definition_data: roleDefData.definition_data
    });
  
  if (saveError) {
    console.warn('⚠️ Failed to save role definition:', saveError.message);
  }
  
  return roleDefData.definition_data as FinalRoleDefinition;
}

/**
 * Seeded shuffle for deterministic randomization
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  let hash = hashString(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.floor((hash / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Select 10 Core questions (highest weighted dimensions)
 */
function selectCoreQuestions(
  questions: QuestionObject[],
  weights: WeightedDimensions['weights'],
  seed: string
): QuestionObject[] {
  // Get top 3 dimensions by weight
  const sortedDimensions = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([dim]) => dim);
  
  console.log('🎯 Core dimensions:', sortedDimensions);
  
  // Filter questions from top 3 dimensions
  const corePool = questions.filter(q => {
    const normalizedDim = q.dimension.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
    return sortedDimensions.some(coreDim => coreDim.includes(normalizedDim) || normalizedDim.includes(coreDim));
  });
  
  // Shuffle with seed for determinism
  const shuffled = seededShuffle(corePool, seed + '_core');
  
  // Take 10, ensuring diversity across archetypes
  const selected: QuestionObject[] = [];
  const usedArchetypes = new Set<string>();
  
  for (const question of shuffled) {
    if (selected.length >= 10) break;
    
    // Prefer unused archetypes
    if (!usedArchetypes.has(question.archetype_id) || selected.length > 7) {
      selected.push(question);
      usedArchetypes.add(question.archetype_id);
    }
  }
  
  return selected;
}

/**
 * Select 10 Variable questions (remaining dimensions)
 */
function selectVariableQuestions(
  questions: QuestionObject[],
  weights: WeightedDimensions['weights'],
  coreQuestions: QuestionObject[],
  seed: string
): QuestionObject[] {
  // Get remaining dimensions (not in top 3)
  const sortedDimensions = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([dim]) => dim);
  
  const coreQuestionIds = new Set(coreQuestions.map(q => q.question_id));
  
  // Filter questions NOT from top 3 dimensions and NOT already selected
  const variablePool = questions.filter(q => {
    if (coreQuestionIds.has(q.question_id)) return false;
    
    const normalizedDim = q.dimension.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
    return !sortedDimensions.some(coreDim => coreDim.includes(normalizedDim) || normalizedDim.includes(coreDim));
  });
  
  // Shuffle with seed
  const shuffled = seededShuffle(variablePool, seed + '_variable');
  
  // Take 10, ensuring dimension diversity
  const selected: QuestionObject[] = [];
  const dimensionCounts = new Map<string, number>();
  
  for (const question of shuffled) {
    if (selected.length >= 10) break;
    
    const dimCount = dimensionCounts.get(question.dimension) || 0;
    
    // Limit to max 4 questions per dimension
    if (dimCount < 4) {
      selected.push(question);
      dimensionCounts.set(question.dimension, dimCount + 1);
    }
  }
  
  return selected;
}

/**
 * Main selection logic: 10 Core + 10 Variable
 */
function selectQuestions(
  bank: RoleMasterBank,
  roleDefinition: FinalRoleDefinition,
  projectId: string
): QuestionObject[] {
  console.log(`🎲 Selecting 20 questions from ${bank.questions.length} available`);
  
  if (bank.questions.length < 20) {
    throw new Error(`Insufficient questions in bank: ${bank.questions.length} (need 20)`);
  }
  
  const seed = projectId; // Use project_id for deterministic selection
  
  // Step 1: Select 10 Core questions
  const coreQuestions = selectCoreQuestions(
    bank.questions,
    roleDefinition.weighted_dimensions.weights,
    seed
  );
  
  console.log(`✅ Selected ${coreQuestions.length} core questions`);
  
  // Step 2: Select 10 Variable questions
  const variableQuestions = selectVariableQuestions(
    bank.questions,
    roleDefinition.weighted_dimensions.weights,
    coreQuestions,
    seed
  );
  
  console.log(`✅ Selected ${variableQuestions.length} variable questions`);
  
  // Combine and return
  return [...coreQuestions, ...variableQuestions];
}

/**
 * Asynchronously invoke fn_ai_question_factory
 */
async function invokeQuestionFactory(
  supabase: any,
  roleDefinition: FinalRoleDefinition,
  bankId: string
): Promise<void> {
  console.log(`🚀 Triggering fn_ai_question_factory for bank_id: ${bankId}`);
  
  try {
    const authHeader = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Fire and forget - don't await
    supabase.functions.invoke('fn_ai_question_factory', {
      body: {
        roleDefinition,
        bank_id: bankId
      },
      headers: {
        Authorization: `Bearer ${authHeader}`
      }
    }).then((result: any) => {
      if (result.error) {
        console.error('❌ fn_ai_question_factory error:', result.error);
      } else {
        console.log('✅ fn_ai_question_factory completed successfully');
      }
    });
    
    console.log('✅ fn_ai_question_factory invoked asynchronously');
  } catch (error) {
    console.error('❌ Failed to invoke fn_ai_question_factory:', error);
    // Don't throw - this is async, should not block response
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎬 fn_generate_audition_scaffold invoked');
    
    // Validate authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { project_id } = await req.json();
    
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'Missing project_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Get or generate role definition
    const roleDefinition = await getOrGenerateRoleDefinition(supabase, project_id);
    
    // Step 2: Extract bank_id
    const bankId = roleDefinition.weighted_dimensions?.bank_id;
    
    if (!bankId) {
      throw new Error('Role definition missing bank_id');
    }
    
    console.log(`🏦 Bank ID: ${bankId}`);

    // Step 3: Query role_master_banks
    const { data: bank, error: bankError } = await supabase
      .from('role_master_banks')
      .select('*')
      .eq('bank_id', bankId)
      .maybeSingle();
    
    if (bankError) {
      throw new Error(`Failed to query role_master_banks: ${bankError.message}`);
    }

    // ========================================================================
    // PATH 1: WARM START (bank exists and is READY)
    // ========================================================================
    if (bank && bank.status === 'READY') {
      console.log('🟢 WARM START: Bank is ready');
      
      const selectedQuestions = selectQuestions(bank, roleDefinition, project_id);
      
      return new Response(JSON.stringify({
        status: 'READY',
        bank_id: bankId,
        questions: selectedQuestions,
        role_definition: roleDefinition,
        cache_hit: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================================================
    // PATH 2: PENDING (bank exists but is GENERATING)
    // ========================================================================
    if (bank && bank.status === 'GENERATING') {
      console.log('🟡 PENDING: Bank is generating');
      
      const elapsedMinutes = Math.floor(
        (Date.now() - new Date(bank.created_at).getTime()) / 60000
      );
      
      return new Response(JSON.stringify({
        status: 'GENERATING',
        bank_id: bankId,
        message: 'Your custom question bank is being generated. This typically takes 2-3 minutes.',
        elapsed_minutes: elapsedMinutes,
        estimated_remaining_minutes: Math.max(0, 3 - elapsedMinutes),
        retry_after_seconds: 10
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================================================
    // PATH 3: COLD START (bank does not exist)
    // ========================================================================
    console.log('🔵 COLD START: Creating new bank');
    
    // Insert new bank with GENERATING status
    const { error: insertError } = await supabase
      .from('role_master_banks')
      .insert({
        bank_id: bankId,
        status: 'GENERATING',
        role_family: roleDefinition.context_flags.role_family,
        seniority_level: roleDefinition.context_flags.seniority,
        questions: []
      });
    
    if (insertError) {
      throw new Error(`Failed to create bank: ${insertError.message}`);
    }
    
    // Asynchronously invoke fn_ai_question_factory
    await invokeQuestionFactory(supabase, roleDefinition, bankId);
    
    return new Response(JSON.stringify({
      status: 'GENERATING',
      bank_id: bankId,
      message: 'Your custom question bank is being generated. This typically takes 2-3 minutes.',
      elapsed_minutes: 0,
      estimated_remaining_minutes: 3,
      retry_after_seconds: 10
    }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in fn_generate_audition_scaffold:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({
      error: errorMessage,
      status: 'FAILED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
