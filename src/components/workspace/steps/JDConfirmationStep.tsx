import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChatMessage } from "../ChatMessage";
import { Check, Edit } from "lucide-react";

interface JDConfirmationStepProps {
  initialRoleTitle: string;
  initialSummary: string;
  onComplete: (roleTitle: string, summary: string) => void;
  onAddMessage: (msg: { type: 'user' | 'assistant'; content: string }) => void;
}

export const JDConfirmationStep = ({ 
  initialRoleTitle, 
  initialSummary, 
  onComplete, 
  onAddMessage 
}: JDConfirmationStepProps) => {
  const [roleTitle, setRoleTitle] = useState(initialRoleTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    onAddMessage({
      type: 'user',
      content: "Confirmed! Let's continue."
    });
    
    onAddMessage({
      type: 'assistant',
      content: "Great! Now let's find your candidates."
    });
    
    onComplete(roleTitle, summary);
  };

  return (
    <div className="space-y-6">
      <ChatMessage
        type="assistant"
        content="Here's what I understood from your Job Description. Please confirm or edit these details:"
        delay={0}
      />

      <div className="space-y-4 bg-card border rounded-lg p-6">
        <div className="space-y-2">
          <Label htmlFor="roleTitle">Role Title</Label>
          <Input
            id="roleTitle"
            value={roleTitle}
            onChange={(e) => {
              setRoleTitle(e.target.value);
              setIsEditing(true);
            }}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Job Summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setIsEditing(true);
            }}
            className="min-h-[120px] text-base resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleConfirm}
          disabled={!roleTitle.trim() || !summary.trim()}
          size="lg"
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          Confirm & Next
        </Button>
      </div>
    </div>
  );
};