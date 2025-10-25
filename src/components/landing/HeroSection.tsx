import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import vettedLandscapeLogo from "@/assets/vetted-landscape-logo.png";

interface HeroSectionProps {
  onCtaClick?: () => void;
}

const shortlist = [
  {
    name: "Aisha Mwangi",
    role: "Operations Lead",
    confidence: "92%",
    signal:
      "Streamlined a messy workflow in minutes — clear logic, confident execution.",
    status: "Decision: Advance",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Luis Martins",
    role: "Customer Success",
    confidence: "88%",
    signal:
      "Navigated a live customer issue — asked sharp questions before resolving calmly.",
    status: "Decision: Advance",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    name: "Tara Singh",
    role: "Chief of Staff",
    confidence: "84%",
    signal:
      "Built a focused strategy outline while toggling data sources in real time.",
    status: "Decision: Review",
    accent: "bg-amber-50 text-amber-700",
  },
];

export const HeroSection = ({ onCtaClick }: HeroSectionProps) => {
  const navigate = useNavigate();

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-white to-muted/40 pt-[72px]">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="absolute -top-16 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-12 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr),minmax(0,420px)] gap-16 items-center">
          <div className="space-y-8">
            <img
              src={vettedLandscapeLogo}
              alt="VettedAI"
              className="h-auto w-full min-w-[25px] max-w-[75px]"
            />

            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="h-4 w-4" /> The Talent Intelligence Workspace
            </span>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                Hire on proof,<span className="text-primary"> not promise.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Resumes and tests don’t tell the full story. VettedAI verifies real work, so you know exactly who can
                deliver. Paste your job description - get a verified shortlist in hours.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <Button variant="hero" size="lg" onClick={handleCtaClick} className="h-auto px-8 py-4 text-base">
                Try VettedAI for your next role
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Verifiable proof in 48-72 hours
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
              <span>Built for recruiters</span>
              <span className="hidden h-px w-10 bg-muted-foreground/20 lg:block" />
              <span>Signals you can trust</span>
              <span className="hidden h-px w-10 bg-muted-foreground/20 lg:block" />
              <span>Confident hires</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border/60 bg-white/90 shadow-[0_20px_60px_-30px_rgba(54,35,119,0.4)] backdrop-blur">
              <div className="border-b border-border/70 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Shortlist preview</p>
                    <p className="text-xl font-semibold">Ops Leadership Sprint</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Noise removed
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Confidence signal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300" /> Proof artefacts
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-6">
                {shortlist.map((candidate) => (
                  <div key={candidate.name} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.role}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${candidate.accent}`}>
                        Confidence {candidate.confidence}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.65rem] font-semibold text-primary shadow-inner">
                          Proof
                        </span>
                        <span className="text-muted-foreground">{candidate.signal}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.7rem]">
                        <span className="font-medium text-foreground">{candidate.status}</span>
                        <span className="text-muted-foreground">View work sample →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
