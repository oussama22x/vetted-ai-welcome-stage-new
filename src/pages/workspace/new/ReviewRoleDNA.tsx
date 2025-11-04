import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Brain, Briefcase, Building2, CheckCircle2, Info, Loader2, Users, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProjectWizard } from "@/hooks/useProjectWizard";
import { supabase } from "@/integrations/supabase/client";

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

interface WeightedDimensions {
  weights: {
    cognitive?: number;
    execution?: number;
    communication?: number;
    adaptability?: number;
    emotional_intelligence?: number;
    judgment?: number;
  };
  rationale: string;
  bank_id: string;
}

interface ClarifierInputs {
  ambiguity?: boolean;
  time_pressure?: boolean;
  cross_functional?: boolean;
  customer_facing?: boolean;
  regulated?: boolean;
  analytical?: boolean;
}

interface RoleDefinition {
  id: string;
  definition_data: RoleDefinitionData;
  context_flags: ContextFlags;
  clarifier_inputs: ClarifierInputs;
  weighted_dimensions: WeightedDimensions;
}

const ReviewRoleDNA = () => {
  const navigate = useNavigate();
  const { wizardState, saveWizardState } = useProjectWizard();
  const projectId = wizardState.projectId || wizardState.project_id;

  useEffect(() => {
    if (!projectId) {
      navigate("/workspace/new/jd-upload");
    }
  }, [projectId, navigate]);

  const roleDefQuery = useQuery({
    queryKey: ["role-definition", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_definitions")
        .select("id, definition_data, context_flags, clarifier_inputs, weighted_dimensions")
        .eq("project_id", projectId)
        .single();

      if (error) throw error;
      return data as unknown as RoleDefinition;
    },
  });

  const handleContinue = () => {
    navigate("/workspace/new/generate-audition");
  };

  const handleBack = () => {
    navigate("/workspace/new/confirm-role-summary");
  };

  if (roleDefQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading role analysis...</p>
        </div>
      </div>
    );
  }

  if (roleDefQuery.isError || !roleDefQuery.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive">Failed to load role definition</p>
          <Button onClick={() => roleDefQuery.refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const roleDef = roleDefQuery.data;
  const weights = roleDef.weighted_dimensions?.weights || {};
  const bankId = roleDef.weighted_dimensions?.bank_id || "N/A";
  const rationale = roleDef.weighted_dimensions?.rationale || "";

  // Calculate total for percentage display
  const totalWeight = Object.values(weights).reduce((sum, val) => sum + (val || 0), 0);

  const dimensionLabels: Record<string, { label: string; icon: any }> = {
    cognitive: { label: "Cognitive", icon: Brain },
    execution: { label: "Execution", icon: CheckCircle2 },
    communication: { label: "Communication/Collaboration", icon: Users },
    adaptability: { label: "Adaptability/Learning", icon: Briefcase },
    emotional_intelligence: { label: "Emotional Intelligence", icon: Users },
    judgment: { label: "Judgment/Ethics", icon: Building2 },
  };

  const clarifierLabels = [
    { key: "ambiguity", label: "Ambiguity", icon: "🧩", desc: "Exploratory, unstructured work" },
    { key: "time_pressure", label: "Time Pressure", icon: "⏱️", desc: "Fast-paced, time-sensitive" },
    { key: "cross_functional", label: "Cross-functional", icon: "🤝", desc: "Works across multiple teams" },
    { key: "customer_facing", label: "Customer-facing", icon: "👥", desc: "Direct customer interaction" },
    { key: "regulated", label: "Regulated", icon: "📋", desc: "Compliance/audit requirements" },
    { key: "analytical", label: "Analytical/Data-heavy", icon: "📊", desc: "Heavy data analysis" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate("/workspace/new/confirm-role-summary")}>
              ← Back
            </Button>
            <span className="text-sm text-muted-foreground">Step 3 of 5: Review Role DNA</span>
          </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Review Role DNA</h1>
          <p className="text-base text-muted-foreground">
            Our AI has analyzed your job description and identified the core dimensions and characteristics of this role.
            These insights will determine which questions are selected for your audition.
          </p>
        </div>

        {/* Context Flags Card */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Role Context
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">High-level classification used to match this role to our question bank</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>Core attributes that define this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-sm">
                <Briefcase className="mr-2 h-3 w-3" />
                {roleDef.context_flags.role_family}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {roleDef.context_flags.seniority}
              </Badge>
              {roleDef.context_flags.is_startup_context && (
                <Badge variant="default" className="text-sm">
                  Startup Context
                </Badge>
              )}
              {roleDef.context_flags.is_people_management && (
                <Badge variant="default" className="text-sm">
                  People Management
                </Badge>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Question Bank ID:</span>{" "}
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{bankId}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Essentials Accordion */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Role Essentials</CardTitle>
            <CardDescription>Detailed breakdown of the role's requirements and context</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="goals">
                <AccordionTrigger>Goals & Objectives</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.goals}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="stakeholders">
                <AccordionTrigger>Stakeholders & Relationships</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.stakeholders}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="decision_horizon">
                <AccordionTrigger>Decision Horizon</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.decision_horizon}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tools">
                <AccordionTrigger>Tools & Systems</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.tools}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kpis">
                <AccordionTrigger>KPIs & Success Metrics</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.kpis}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="constraints">
                <AccordionTrigger>Constraints & Challenges</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.constraints}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cognitive">
                <AccordionTrigger>Cognitive Type</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.cognitive_type}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="team">
                <AccordionTrigger>Team Topology</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.team_topology}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="culture">
                <AccordionTrigger>Cultural Tone</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{roleDef.definition_data.cultural_tone}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Clarifier Signals */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Role Characteristics</CardTitle>
            <CardDescription>Situational factors that influence question selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clarifierLabels.map((clarifier) => {
                const isActive = roleDef.clarifier_inputs?.[clarifier.key as keyof ClarifierInputs];
                return (
                  <div
                    key={clarifier.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isActive ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-muted"
                    }`}
                  >
                    <span className="text-2xl">{clarifier.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {clarifier.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{clarifier.desc}</p>
                    </div>
                    {isActive && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dimension Weights */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Performance Dimension Weights
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm">
                    These weights determine how many questions will be selected from each performance dimension. 
                    Higher weights mean more focus on that dimension in the audition.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>How we'll distribute questions across performance dimensions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(weights).map(([dimension, weight]) => {
                const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(0) : "0";
                const info = dimensionLabels[dimension];
                const Icon = info?.icon || Brain;

                const dimensionTooltips: Record<string, string> = {
                  cognitive: "Problem-solving, analytical thinking, and decision-making abilities",
                  execution: "Ability to deliver results, manage time, and drive projects to completion",
                  communication: "Teamwork, stakeholder management, and interpersonal skills",
                  adaptability: "Flexibility, continuous learning, and resilience in changing environments",
                  emotional_intelligence: "Self-awareness, empathy, and managing emotions in professional settings",
                  judgment: "Ethical decision-making, integrity, and sound professional judgment"
                };

                return (
                  <div key={dimension} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Icon className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              <strong>{info?.label || dimension}:</strong> {dimensionTooltips[dimension]}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-sm font-medium">{info?.label || dimension}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{percentage}%</span>
                    </div>
                    <Progress value={Number(percentage)} className="h-2" />
                  </div>
                );
              })}
            </div>

            {rationale && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Why these weights?</p>
                <p className="text-sm text-muted-foreground">{rationale}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={handleBack}>
            ← Edit Job Description
          </Button>
          <Button onClick={handleContinue} size="lg" className="transition-all duration-200 hover:scale-105">
            This Looks Right, Continue →
          </Button>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ReviewRoleDNA;
