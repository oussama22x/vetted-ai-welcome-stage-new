import { useState, useEffect } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "../ChatMessage";
import { toast } from "@/hooks/use-toast";

interface CheckoutStepProps {
  onComplete: () => void;
}

export const CheckoutStep = ({ onComplete }: CheckoutStepProps) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Simulate payment processing
    const timer = setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <ChatMessage
          type="assistant"
          content="Processing your payment..."
          delay={0}
        />
        <div className="flex justify-center py-12">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow">
            <CheckCircle className="w-24 h-24 text-primary opacity-20" />
          </div>
          <CheckCircle className="relative w-24 h-24 text-primary" />
        </div>
      </div>

      <ChatMessage
        type="assistant"
        content={
          <div className="space-y-3">
            <p className="text-lg font-semibold text-primary">Payment Successful!</p>
            <p className="leading-relaxed">
              Awesome. You can track progress in your Project Folder.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll notify you when your shortlist is ready (typically within 48-72 hours).
            </p>
          </div>
        }
        delay={0}
      />

      <div className="flex justify-center pt-4 animate-fade-in">
        <Button 
          onClick={() => {
            toast({
              title: "Project folder coming soon!",
              description: "You'll be able to track your candidates here.",
            });
            onComplete();
          }} 
          size="lg" 
          className="gap-2"
        >
          Go to Folder
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
