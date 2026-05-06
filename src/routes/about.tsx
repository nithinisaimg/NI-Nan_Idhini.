import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How NI works · System overview" },
      { name: "description", content: "How NI uses NLP, machine learning, and a safety layer to provide solo self-calming recommendations. Limits and ethical framing." },
      { property: "og:title", content: "How NI works" },
      { property: "og:description", content: "NLP + ML + safety layer for emotional wellness support." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">System overview</div>
      <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">How NI works</h1>

      <Section title="Pipeline">
        <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <Step n="1" t="Input">You describe how you feel in free text. No account, no log of identity.</Step>
          <Step n="2" t="Preprocessing">Text is normalized, tokenized, and cleaned before model inference.</Step>
          <Step n="3" t="Emotion classification">A multi-class model maps your text to one of: anxious, stressed, overwhelmed, sad, lonely, angry, exhausted, calm.</Step>
          <Step n="4" t="Stress scoring">Intensity is estimated as low, medium, or high with a confidence score.</Step>
          <Step n="5" t="Safety layer">A deterministic detector scans for crisis phrases. If found, normal flow is overridden with a safety response.</Step>
          <Step n="6" t="Solo recommendations">A mapping engine returns calm, low-risk, single-person actions you can try right now.</Step>
        </ol>
      </Section>

      <Section title="What NI is not">
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>Not a medical diagnosis platform.</li>
          <li>Not a replacement for therapy or medication.</li>
          <li>Not an emergency service. In immediate danger, contact local emergency services.</li>
        </ul>
      </Section>

      <Section title="Design principles">
        <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
          <li>Open access — no login, no signup.</li>
          <li>Calm, respectful, non-judgmental tone.</li>
          <li>Focus on solo self-regulation, not group dependency.</li>
          <li>Safety always overrides recommendation logic.</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="text-foreground/60 tabular-nums w-6">{n}</span>
      <div>
        <div className="text-foreground">{t}</div>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}
