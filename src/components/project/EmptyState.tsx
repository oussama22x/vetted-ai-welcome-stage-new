import { ClipboardCheck } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
        <ClipboardCheck className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Your Proof-of-Work challenges are being scored.</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        You'll receive a shortlist link within 48-72 hours.
      </p>
    </div>
  );
};
