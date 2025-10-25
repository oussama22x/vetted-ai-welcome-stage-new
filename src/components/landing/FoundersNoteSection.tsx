const founders = [{
  initials: "TL",
  name: "Tobi Lafinhan",
  role: "Co-founder & CEO"
}, {
  initials: "AA",
  name: "Aanu Adediran",
  role: "Co-founder & COO"
}];
export const FoundersNoteSection = () => {
  return <section className="px-6 py-24 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-border/60 bg-muted/20 p-10 md:p-14 shadow-sm">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            <div className="space-y-4 lg:w-2/5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Built by recruiters
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
                Built by people who've been on the hiring frontlines.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We’re not theorists. We’ve spent years hiring across Africa’s fastest-growing teams, feeling the same pain recruiters still face today. VettedAI is the product we needed in those rooms.
              </p>

              
            </div>

            <div className="lg:w-3/5">
              <blockquote className="rounded-3xl border border-border/50 bg-white/90 p-8 text-lg leading-relaxed text-foreground shadow-inner">
                "Proof of work used to take weeks of coordination. VettedAI packages it into a workspace that feels human and fast—so you can spend time with the people who will actually move your business forward."
                <footer className="mt-6 text-sm text-muted-foreground">— The VettedAI Team</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>;
};