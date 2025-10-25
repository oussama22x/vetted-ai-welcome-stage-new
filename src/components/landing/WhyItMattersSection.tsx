import { CheckCircle2, FileText, Gauge, ListChecks, Sparkles, XCircle } from "lucide-react";

const advantages = [
  {
    icon: Gauge,
    title: "Confidence without the chaos",
    description: "Go from guesses to grounded decisions. Every shortlist pairs a confidence signal with the proof behind it.",
  },
  {
    icon: ListChecks,
    title: "Signals your team can align on",
    description: "Structured scoring makes it simple to compare candidates against the work that actually matters to your role.",
  },
  {
    icon: Sparkles,
    title: "Proof delivered in hours, not weeks",
    description: "VettedAI handles the busywork—crafting role-specific tasks, collecting responses, and surfacing what stands out.",
  },
];

export const WhyItMattersSection = () => {
  return (
    <section className="px-6 py-24 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-[0.3em]">
            Why it matters
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            The problem isn't filtering harder. It's seeing better.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Traditional hiring tools stop at the resume. They leave you hoping the keywords translate to the work. VettedAI delivers the proof: how candidates think, collaborate, and execute when the stakes are real.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <XCircle className="h-4 w-4 text-rose-500" /> The old way
            </div>
            <h3 className="mt-4 text-2xl font-semibold">Hiring in the dark.</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Endless CV reviews. Unstructured interviews. Gut feel and guesswork.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <FileText className="mt-0.5 h-4 w-4" />
                Resumes that look perfect on paper but tell you nothing about how someone actually performs.
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 text-rose-500" />
                Hours wasted coordinating teams around incomplete, inconsistent information.
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 text-rose-500" />
                Decisions made with doubt because nothing feels verifiable.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 shadow-[0_20px_50px_-30px_rgba(54,35,119,0.4)]">
            <div className="flex items-center gap-3 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" /> The VettedAI way
            </div>
            <h3 className="mt-4 text-2xl font-semibold">Proof you can put in front of a hiring panel.</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Every candidate delivers a work sample crafted for your role—scored, summarised, and ready to share.
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Proof of work</p>
                <p className="mt-1 text-muted-foreground">Structured deliverables that reveal thinking, collaboration, and pace.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Confidence signal</p>
                <p className="mt-1 text-muted-foreground">A clean, shared scorecard that shows exactly why a candidate made the shortlist.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-white/80 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Decision ready</p>
                <p className="mt-1 text-muted-foreground">Bring hiring managers into the conversation with proof they can trust.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {advantages.map((advantage) => {
            const Icon = advantage.icon;
            return (
              <div
                key={advantage.title}
                className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-5 text-lg font-semibold">{advantage.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{advantage.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
