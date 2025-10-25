import { Card } from "@/components/ui/card";
import { ArrowUpRight, ClipboardList, Send } from "lucide-react";

const steps = [
  {
    title: "Paste your job description",
    description:
      "Drop in what you're hiring for. Our co-pilot helps you tighten the scope so the work mirrors the real role.",
    icon: ClipboardList,
  },
  {
    title: "Send it to your candidates",
    description:
      "Candidates complete the experience in their browser. No logins, no friction—just a guided space to show their work.",
    icon: Send,
  },
  {
    title: "See your shortlist",
    description:
      "Get a confident shortlist with context, scoring, and next steps. Share it with hiring managers in one click.",
    icon: ArrowUpRight,
  },
];

export const ProductSection = () => {
  return (
    <section className="px-6 py-24 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4">
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            Here's how VettedAI fits into your week.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A single workspace that turns job descriptions into role-specific proof of work—without adding hours to your schedule.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.title}
                className="relative flex h-full flex-col gap-4 rounded-3xl border border-border/60 bg-muted/20 p-8 shadow-sm"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-primary shadow">{`0${index + 1}`}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
