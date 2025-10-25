import { useState } from "react";
import { Mic, Lightbulb, BarChart, ArrowRight } from "lucide-react";
import { ChatMessage } from "../ChatMessage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TierInfo } from "@/hooks/useChatFlow";

interface TierSelectionStepProps {
  candidateCount: number;
  onComplete: (tier: TierInfo) => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string }) => void;
}

const tiers: TierInfo[] = [
  {
    id: 1,
    name: "Quick Fit Screen",
    description: "5-minute async video response to key questions about their experience and approach.",
    anchorPrice: 150,
    pilotPrice: 15,
    features: [
      "Core competency evaluation",
      "Basic problem-solving tasks",
      "48-72 hour delivery"
    ]
  },
  {
    id: 2,
    name: "Scenario Fit",
    description: "Real work scenario with evaluation. Candidates solve a realistic problem from your domain.",
    anchorPrice: 200,
    pilotPrice: 20,
    features: [
      "Advanced technical challenges",
      "Real-world scenario simulation",
      "Detailed performance insights"
    ]
  },
  {
    id: 3,
    name: "Role Simulation",
    description: "Full role simulation with TI Matrix. Comprehensive assessment across all key competencies.",
    anchorPrice: 300,
    pilotPrice: 30,
    features: [
      "Executive-level assessment",
      "Strategic thinking evaluation",
      "Comprehensive skill analysis"
    ]
  },
];

const tierIcons = {
  1: Mic,
  2: Lightbulb,
  3: BarChart,
};

export const TierSelectionStep = ({ candidateCount, onComplete, onAddMessage }: TierSelectionStepProps) => {
  const [selected, setSelected] = useState<TierInfo | null>(null);

  const handleSelect = (tier: TierInfo) => {
    setSelected(tier);
  };

  const handleContinue = () => {
    if (selected) {
      // Add user's choice as message
      onAddMessage({
        type: 'user',
        content: `I'll use Tier ${selected.id}: ${selected.name}`
      });
      
      // Add assistant response
      onAddMessage({
        type: 'assistant',
        content: "Excellent choice. Let me show you the pilot pricing."
      });
      
      onComplete(selected);
    }
  };

  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="Choose your Proof-of-Work tier. Each tier provides deeper insight into candidate abilities."
        delay={0}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const Icon = tierIcons[tier.id];
          const isSelected = selected?.id === tier.id;

          return (
            <button
              key={tier.id}
              onClick={() => handleSelect(tier)}
              className={cn(
                "group relative p-6 rounded-xl border-2 transition-all duration-250 text-left",
                "hover:-translate-y-1 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-secondary/30"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    Tier {tier.id}: {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>

              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex justify-center pt-4 animate-fade-in">
          <Button onClick={handleContinue} size="lg" className="gap-2">
            Review Project
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
