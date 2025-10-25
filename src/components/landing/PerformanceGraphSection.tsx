import { Check, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Strategic thinking", value: 92 },
  { label: "Collaboration", value: 88 },
  { label: "Execution speed", value: 86 },
  { label: "Quality of insight", value: 90 },
];

const learnings = [
  "Benchmarked against hires that are already thriving in your org.",
  "Understands how they approach ambiguous, high-leverage scenarios.",
  "Surfaces the 'how' behind the work—not just the finished artefact.",
];

export const PerformanceGraphSection = () => {
  return (
    <section className="px-6 py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto grid gap-16 lg:grid-cols-[minmax(0,420px),minmax(0,1fr)] items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-[0.3em]">
            Performance Graph
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            Powered by the Performance Graph.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We learn from every assessment your team runs. The Performance Graph combines behavioural signals, work quality, and context so each hire gets easier than the last.
          </p>
          <div className="space-y-3">
            {learnings.map((learning) => (
              <div key={learning} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                {learning}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-3xl bg-primary/20 opacity-20 blur-3xl" />
          <div className="relative rounded-3xl border border-border/60 bg-white p-8 shadow-[0_20px_50px_-30px_rgba(54,35,119,0.4)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Talent Intelligence Matrix</p>
                <p className="text-xl font-semibold">Ops Leadership Sprint</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <TrendingUp className="h-4 w-4" /> Confidence +27%
              </div>
            </div>

            <div className="mt-8 space-y-5">
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between text-sm font-medium text-foreground">
                    <span>{metric.label}</span>
                    <span>{metric.value}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Proof collected</p>
                <p className="mt-2 text-sm text-foreground">Work samples, Loom walkthroughs, stakeholder notes.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Decision ready</p>
                <p className="mt-2 text-sm text-foreground">Shareable summary that plugs directly into your hiring flow.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
