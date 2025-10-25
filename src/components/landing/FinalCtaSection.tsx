import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FinalCtaSectionProps {
  onCtaClick?: () => void;
}

export const FinalCtaSection = ({ onCtaClick }: FinalCtaSectionProps) => {
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="px-6 py-24 bg-gradient-to-b from-muted/40 via-white to-background">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Ready to hire differently?
        </span>
        <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
          See who's real. Skip the rest.
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          VettedAI brings clarity back to hiring so you can spend less time guessing and more time meeting the right people.
        </p>
        <div className="pt-4">
          <Button
            variant="hero"
            size="lg"
            onClick={handleCtaClick}
            className="h-auto px-8 py-4 text-base"
          >
            Get started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
