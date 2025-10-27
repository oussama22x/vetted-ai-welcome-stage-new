import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useProjectWizard } from "@/hooks/useProjectWizard";

interface RoleDefinitionData {
  goals: string;
  stakeholders: string;
  decision_horizon: string;
  tools: string;
  kpis: string;
  constraints: string;
  cognitive_type: string;
  team_topology: string;
  cultural_tone: string;
}

interface ContextFlags {
  role_family: string;
  seniority: string;
  is_startup_context: boolean;
  is_people_management: boolean;
}

interface RoleDefinitionResponse {
  definition_data?: RoleDefinitionData;
  context_flags?: ContextFlags;
  clarifier_questions?: string[];
}

interface RoleSummaryQueryResult {
  roleDefinition: RoleDefinitionData;
  contextFlags: ContextFlags;
  clarifierQuestions: string[];
}

interface ConfirmPayload {
  roleDefinition: RoleDefinitionData;
  contextFlags: ContextFlags;
  clarifierResponses: Record<string, string>;
}

const EMPTY_ROLE_DEFINITION: RoleDefinitionData = {
  goals: "",
  stakeholders: "",
  decision_horizon: "",
  tools: "",
  kpis: "",
  constraints: "",
  cognitive_type: "",
  team_topology: "",
  cultural_tone: "",
};

const DEFAULT_CONTEXT_FLAGS: ContextFlags = {
  role_family: "Other",
  seniority: "Not specified",
  is_startup_context: false,
  is_people_management: false,
};

const COGNITIVE_TYPE_OPTIONS = ["Analytical", "Creative", "Procedural", "Not specified"];
const TEAM_TOPOLOGY_OPTIONS = ["Solo", "Cross-functional", "Not specified"];
const ROLE_FAMILY_OPTIONS = [
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
];
const SENIORITY_OPTIONS = ["Junior", "Mid-Level", "Senior", "Manager", "Not specified"];

const parseEdgeResponse = <T,>(payload: unknown, errorMessage: string): T => {
  if (!payload) {
    throw new Error(errorMessage);
  }

  try {
    if (typeof payload === "string") {
      return JSON.parse(payload) as T;
    }

    return payload as T;
  } catch (error) {
    console.error("Failed to parse edge function response", error);
    throw new Error(errorMessage);
  }
};

const FieldLabel = ({ htmlFor, label, tooltip }: { htmlFor: string; label: string; tooltip: string }) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={htmlFor} className="text-sm font-medium">
      {label}
    </Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={tooltip}
        >
          <Info className="h-4 w-4" />
          <span className="sr-only">{tooltip}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs">
        <p className="text-sm leading-relaxed">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);

const ConfirmRoleSummary = () => {
  const navigate = useNavigate();
  const { wizardState } = useProjectWizard();

  const [roleDefinition, setRoleDefinition] = useState<RoleDefinitionData | null>(null);
  const [contextFlags, setContextFlags] = useState<ContextFlags | null>(null);
  const [clarifierQuestions, setClarifierQuestions] = useState<string[]>([]);
  const [clarifierResponses, setClarifierResponses] = useState<Record<string, string>>({});
  const [hasInitializedFromQuery, setHasInitializedFromQuery] = useState(false);

  useEffect(() => {
    if (!wizardState.jdContent) {
      navigate("/workspace/new/jd-upload");
    }
  }, [wizardState.jdContent, navigate]);

  const roleDefinitionQuery = useQuery({
    queryKey: ["role-definition", wizardState.jdContent],
    enabled: !!wizardState.jdContent,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async (): Promise<RoleSummaryQueryResult> => {
      const jdContent = wizardState.jdContent;

      if (!jdContent) {
        throw new Error("Job description missing. Please return to the previous step.");
      }

      const { data: definitionRaw, error: definitionError } = await supabase.functions.invoke(
        "fn_generate_role_definition",
        {
          body: { jd_text: jdContent },
        },
      );

      if (definitionError) {
        console.error("Role definition generation failed", definitionError);
        throw new Error(definitionError.message || "We couldn't generate the role definition. Please try again.");
      }

      const parsed = parseEdgeResponse<RoleDefinitionResponse>(
        definitionRaw,
        "We couldn't understand that job description. Please try again.",
      );

      const definitionData = parsed.definition_data ? { ...parsed.definition_data } : { ...EMPTY_ROLE_DEFINITION };
      const contextData = parsed.context_flags ? { ...parsed.context_flags } : { ...DEFAULT_CONTEXT_FLAGS };
      const clarifiers = Array.isArray(parsed.clarifier_questions) ? parsed.clarifier_questions : [];

      return {
        roleDefinition: definitionData,
        contextFlags: contextData,
        clarifierQuestions: clarifiers,
      };
    },
  });

  useEffect(() => {
    if (roleDefinitionQuery.data) {
      setRoleDefinition(prev => {
        if (prev && hasInitializedFromQuery) {
          return prev;
        }

        return { ...roleDefinitionQuery.data.roleDefinition };
      });

      setContextFlags(prev => {
        if (prev && hasInitializedFromQuery) {
          return prev;
        }

        return { ...roleDefinitionQuery.data.contextFlags };
      });

      setClarifierQuestions(roleDefinitionQuery.data.clarifierQuestions);

      setClarifierResponses(prev => {
        const next: Record<string, string> = {};
        roleDefinitionQuery.data?.clarifierQuestions.forEach(question => {
          next[question] = prev[question] ?? "";
        });
        return next;
      });

      if (!hasInitializedFromQuery) {
        setHasInitializedFromQuery(true);
      }
    }
  }, [roleDefinitionQuery.data, hasInitializedFromQuery]);

  const confirmMutation = useMutation({
    mutationFn: async (payload: ConfirmPayload) => payload,
  });

  const updateRoleDefinition = <K extends keyof RoleDefinitionData>(
    key: K,
    value: RoleDefinitionData[K],
  ) => {
    setRoleDefinition(prev => ({
      ...(prev ?? EMPTY_ROLE_DEFINITION),
      [key]: value,
    }));
  };

  const updateContextFlags = <K extends keyof ContextFlags>(key: K, value: ContextFlags[K]) => {
    setContextFlags(prev => ({
      ...(prev ?? DEFAULT_CONTEXT_FLAGS),
      [key]: value,
    }));
  };

  const handleConfirm = () => {
    if (!roleDefinition || !contextFlags) {
      return;
    }

    confirmMutation.mutate({
      roleDefinition,
      contextFlags,
      clarifierResponses,
    });
  };

  const handleClarifierChange = (question: string, value: string) => {
    setClarifierResponses(prev => ({
      ...prev,
      [question]: value,
    }));
  };

  const queryErrorMessage =
    roleDefinitionQuery.error instanceof Error
      ? roleDefinitionQuery.error.message
      : "We couldn't load the role definition. Please try again.";

  const isGenerating = roleDefinitionQuery.isLoading && !roleDefinition;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate("/workspace/new/jd-upload")}>Back</Button>
            <span className="text-sm text-muted-foreground">Step 2 of 4</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold">Let's Map Your Role's DNA</h1>
            <p className="text-base text-muted-foreground">
              We've decoded your Job Description to pinpoint the signals for top performance. Take a quick look – does this match how you see the role?
            </p>
          </div>

          {roleDefinitionQuery.isError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load your role DNA</AlertTitle>
              <AlertDescription>{queryErrorMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">The Role DNA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating your role definition...</span>
                </div>
              )}

              {roleDefinition && contextFlags && (
                <>
                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">Performance Levers</h2>
                      <p className="text-sm text-muted-foreground">
                        These are the core activities and contexts that define success in the role. Tuning these helps us design Audition tasks that truly reflect the job.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="goals"
                          label="Goals"
                          tooltip="Think results, not just tasks. e.g., \"Increase user signups,\" \"Reduce customer churn\""
                        />
                        <Textarea
                          id="goals"
                          placeholder="Describe the key outcomes"
                          value={roleDefinition.goals}
                          onChange={event => updateRoleDefinition("goals", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="stakeholders"
                          label="Stakeholders"
                          tooltip="e.g., \"Engineering, Sales,\" \"External clients,\" \"Exec team\""
                        />
                        <Textarea
                          id="stakeholders"
                          placeholder="List the main collaborators or audiences"
                          value={roleDefinition.stakeholders}
                          onChange={event => updateRoleDefinition("stakeholders", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="decision-horizon"
                          label="Decision Horizon"
                          tooltip="e.g., \"Daily optimizations,\" \"Quarterly strategy,\" \"High-stakes calls\""
                        />
                        <Textarea
                          id="decision-horizon"
                          placeholder="Explain the typical scope of decisions"
                          value={roleDefinition.decision_horizon}
                          onChange={event => updateRoleDefinition("decision_horizon", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="tools"
                          label="Tools"
                          tooltip="e.g., \"Figma, Jira,\" \"Salesforce,\" \"Python, AWS\""
                        />
                        <Textarea
                          id="tools"
                          placeholder="Which tools are crucial for getting the job done?"
                          value={roleDefinition.tools}
                          onChange={event => updateRoleDefinition("tools", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="kpis"
                          label="KPIs"
                          tooltip="e.g., \"Conversion rate,\" \"Revenue growth,\" \"Feature adoption\""
                        />
                        <Textarea
                          id="kpis"
                          placeholder="Describe how success will be measured"
                          value={roleDefinition.kpis}
                          onChange={event => updateRoleDefinition("kpis", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="constraints"
                          label="Constraints"
                          tooltip="e.g., \"GDPR compliance,\" \"Budget limits,\" \"Legacy tech\""
                        />
                        <Textarea
                          id="constraints"
                          placeholder="Note the guardrails or challenges"
                          value={roleDefinition.constraints}
                          onChange={event => updateRoleDefinition("constraints", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <FieldLabel
                          htmlFor="cognitive-type"
                          label="Cognitive Type"
                          tooltip="Analytical=data/logic; Creative=ideas/design; Procedural=process/systems"
                        />
                        <Select
                          value={roleDefinition.cognitive_type || undefined}
                          onValueChange={value => updateRoleDefinition("cognitive_type", value)}
                        >
                          <SelectTrigger id="cognitive-type">
                            <SelectValue placeholder="Select the thinking style" />
                          </SelectTrigger>
                          <SelectContent>
                            {COGNITIVE_TYPE_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel
                          htmlFor="team-topology"
                          label="Team Topology"
                          tooltip="Solo=independent focus; Cross-functional=team collaboration"
                        />
                        <Select
                          value={roleDefinition.team_topology || undefined}
                          onValueChange={value => updateRoleDefinition("team_topology", value)}
                        >
                          <SelectTrigger id="team-topology">
                            <SelectValue placeholder="Select how they will work" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEAM_TOPOLOGY_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel
                          htmlFor="cultural-tone"
                          label="Cultural Tone"
                          tooltip="e.g., \"Fast-paced, Agile,\" \"Formal, Regulated,\" \"Collaborative, Research-driven\""
                        />
                        <Textarea
                          id="cultural-tone"
                          placeholder="Describe the team or company vibe"
                          value={roleDefinition.cultural_tone}
                          onChange={event => updateRoleDefinition("cultural_tone", event.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">Context Signals</h2>
                      <p className="text-sm text-muted-foreground">
                        These signals help us select the most relevant performance dimensions to measure (like Judgment or Adaptability).
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel
                          htmlFor="role-family"
                          label="Role Family"
                          tooltip="Helps tailor task relevance."
                        />
                        <Select
                          value={contextFlags.role_family || undefined}
                          onValueChange={value => updateContextFlags("role_family", value)}
                        >
                          <SelectTrigger id="role-family">
                            <SelectValue placeholder="Closest standard role?" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_FAMILY_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel
                          htmlFor="seniority"
                          label="Seniority"
                          tooltip="Affects task complexity & dimensions like 'Judgment'."
                        />
                        <Select
                          value={contextFlags.seniority || undefined}
                          onValueChange={value => updateContextFlags("seniority", value)}
                        >
                          <SelectTrigger id="seniority">
                            <SelectValue placeholder="Experience level?" />
                          </SelectTrigger>
                          <SelectContent>
                            {SENIORITY_OPTIONS.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-3 rounded-lg border border-border/80 p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Startup Context?</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Checking this adds weight to 'Adaptability'."
                              >
                                <Info className="h-4 w-4" />
                                <span className="sr-only">Checking this adds weight to 'Adaptability'.</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-xs">
                              <p className="text-sm leading-relaxed">Checking this adds weight to 'Adaptability'.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="startup-context"
                            checked={contextFlags.is_startup_context}
                            onCheckedChange={checked =>
                              updateContextFlags("is_startup_context", checked === true)
                            }
                          />
                          <Label htmlFor="startup-context" className="text-sm">
                            Is this role in a startup or similar fast-paced setting?
                          </Label>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3 rounded-lg border border-border/80 p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">People Management?</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Checking this adds weight to 'Emotional Intelligence'."
                              >
                                <Info className="h-4 w-4" />
                                <span className="sr-only">Checking this adds weight to 'Emotional Intelligence'.</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-xs">
                              <p className="text-sm leading-relaxed">Checking this adds weight to 'Emotional Intelligence'.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="people-management"
                            checked={contextFlags.is_people_management}
                            onCheckedChange={checked =>
                              updateContextFlags("is_people_management", checked === true)
                            }
                          />
                          <Label htmlFor="people-management" className="text-sm">
                            Will this role directly manage people?
                          </Label>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </CardContent>
          </Card>

          {clarifierQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">🔍 Quick Checks Needed</CardTitle>
                <CardDescription>
                  Your JD was clear, but we need a little more detail on these points to make the Audition spot-on. Your brief answers will help us finalize the design.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {clarifierQuestions.map((question, index) => (
                  <div key={question} className="space-y-2">
                    <Label htmlFor={`clarifier-${index}`} className="text-sm font-medium">
                      {question}
                    </Label>
                    <Textarea
                      id={`clarifier-${index}`}
                      placeholder="Your brief answer here (1-2 sentences is perfect)"
                      value={clarifierResponses[question] ?? ""}
                      onChange={event => handleClarifierChange(question, event.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleConfirm}
              disabled={!roleDefinition || !contextFlags || confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm & Generate Audition"
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ConfirmRoleSummary;
