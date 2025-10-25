import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_CHAR_COUNT = 10_000;
const CHAR_LIMIT_MESSAGE =
  "Your job description is over the 10,000-character limit. For best results with our AI Co-pilot, please use a more concise JD focused on the core responsibilities and qualifications.";

interface JobDescriptionStepProps {
  onComplete: (jd: string, summary: string, jobTitle: string) => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string | React.ReactNode }) => void;
  onSetTyping: (isTyping: boolean) => void;
}

export const JobDescriptionStep = ({ onComplete, onAddMessage, onSetTyping }: JobDescriptionStepProps) => {
  const [jd, setJd] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const characterCount = jd.length;
  const isOverCharLimit = characterCount > MAX_CHAR_COUNT;
  const formattedCharacterCount = useMemo(
    () => `${characterCount.toLocaleString()} / ${MAX_CHAR_COUNT.toLocaleString()}`,
    [characterCount]
  );

  const handleSubmit = async () => {
    if (isOverCharLimit || characterCount < 50) {
      return;
    }

    setIsGenerating(true);

    // Add user's JD as message
    onAddMessage({
      type: 'user',
      content: `[Job Description submitted]`
    });
    
    // Show typing indicator
    onSetTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSetTyping(false);
    
    // Generate summary and title for the next step
    const generatedSummary = "Senior Full-Stack Engineer role requiring 5+ years experience with React, Node.js, and cloud infrastructure. Focus on building scalable systems and mentoring junior developers. Remote-friendly position with competitive compensation.";
    const extractedJobTitle = "Senior Full-Stack Engineer";
    
    onAddMessage({
      type: 'assistant',
      content: "Great! Let me analyze that for you..."
    });
    
    setIsGenerating(false);
    onComplete(jd, generatedSummary, extractedJobTitle);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste or type the full job description here..."
          className="min-h-[200px] text-base resize-none"
        />

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Share the core responsibilities and qualifications for this role.
          </div>
          <div
            className={cn(
              "font-medium",
              isOverCharLimit ? "text-destructive" : "text-muted-foreground"
            )}
            aria-live="polite"
          >
            {formattedCharacterCount}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={characterCount < 50 || isOverCharLimit || isGenerating}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Continue'
          )}
        </Button>
        {isOverCharLimit && (
          <div className="text-sm text-destructive text-right">{CHAR_LIMIT_MESSAGE}</div>
        )}
      </div>
    </div>
  );
};
