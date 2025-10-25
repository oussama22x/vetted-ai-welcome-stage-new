import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentSuccessProps {
  onContinue: () => void;
}

export const PaymentSuccess = ({ onContinue }: PaymentSuccessProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center py-16 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#D6D1FF] flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-14 h-14 text-[#5A4FCF]" />
        </div>
        <div className="absolute inset-0 rounded-full bg-[#D6D1FF] animate-ping opacity-20" />
      </div>

      <h2 className="text-2xl font-bold mb-2 text-center">Payment confirmed!</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Your project folder has been created.
      </p>

      <Button onClick={onContinue} size="lg" className="gap-2">
        Go to Folder →
      </Button>
    </div>
  );
};
