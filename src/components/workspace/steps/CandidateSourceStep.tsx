import { useState } from "react";
import { Upload, Network } from "lucide-react";
import { ChatMessage } from "../ChatMessage";
import { cn } from "@/lib/utils";

interface CandidateSourceStepProps {
  onComplete: (source: 'own' | 'network') => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string }) => void;
}

export const CandidateSourceStep = ({ onComplete, onAddMessage }: CandidateSourceStepProps) => {
  const [selected, setSelected] = useState<'own' | 'network' | null>(null);

  const handleSelect = (source: 'own' | 'network') => {
    setSelected(source);
    
    // Add user's choice as message
    onAddMessage({
      type: 'user',
      content: source === 'own' 
        ? "I'll upload my own candidates"
        : "Use VettedAI's candidate network"
    });
    
    // Add assistant response
    const response = source === 'own'
      ? "Great! Let's get those resumes uploaded."
      : "Perfect! I'll connect you with our pre-vetted network.";
    
    onAddMessage({
      type: 'assistant',
      content: response
    });
    
    setTimeout(() => {
      onComplete(source);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="Would you like to vet your own candidates or use our network?"
        delay={0}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect('own')}
          className={cn(
            "group relative p-6 rounded-xl border-2 transition-all duration-250",
            "hover:-translate-y-1 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            selected === 'own'
              ? "border-primary bg-secondary/30"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Use My Candidates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload resumes of candidates you've already sourced
              </p>
            </div>
          </div>
          {selected === 'own' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => handleSelect('network')}
          className={cn(
            "group relative p-6 rounded-xl border-2 transition-all duration-250",
            "hover:-translate-y-1 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            selected === 'network'
              ? "border-primary bg-secondary/30"
              : "border-border bg-card hover:border-primary/50"
          )}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Use VettedAI Network</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Let us source pre-vetted candidates from our network
              </p>
            </div>
          </div>
          {selected === 'network' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
