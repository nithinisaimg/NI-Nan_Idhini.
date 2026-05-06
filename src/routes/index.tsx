import { createFileRoute, Link } from "@tanstack/react-router";
import { Waveform } from "@/components/waveform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NI — Nan Idhini · AI Mental Wellness Support" },
      { name: "description", content: "Open-access AI wellness support. Describe how you feel. Receive a calm, NLP-driven response and solo self-calming steps. No login." },
      { property: "og:title", content: "NI — Nan Idhini" },
      { property: "og:description", content: "Understand. Calm. Continue." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-grid">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 bg-foreground pulse-dot" />
              <span>System online · No login required</span>
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Understand. <span className="text-muted-foreground">Calm.</span> Continue.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              NI (Nan Idhini) is an AI-based mental wellness support system. Describe how you feel — NLP and machine learning identify your emotional state, estimate stress, and respond with calm solo self-care steps you can do alone.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <Link
                to="/chat"
                className="group inline-flex items-center gap-3 border border-foreground bg-foreground text-background px-5 py-3 text-xs tracking-[0.25em] uppercase hover:bg-background hover:text-foreground transition"
              >
                Start a session
                <span className="inline-block translate-y-px">→</span>
              </Link>
              <Link to="/about" className="px-5 py-3 text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition">
                How it works
              </Link>
            </div>
            <p className="mt-8 text-xs text-muted-foreground max-w-md">
              Supportive guidance only. NI is not a diagnosis, therapy replacement, or emergency service.
            </p>
          </div>

          {/* Robotic interface mock */}
          <div className="lg:col-span-5">
            <div className="border border-border bg-surface scanline relative">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border text-[10px] tracking-widest uppercase text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-foreground pulse-dot" />
                  ni.core.listening
                </div>
                <span>v0.1</span>
              </div>
              <div className="p-6 space-y-5">
                <div className="text-xs text-muted-foreground tracking-widest uppercase">Input · user</div>
                <div className="border-l-2 border-border pl-3 text-sm leading-relaxed">
                  "I feel overwhelmed and mentally exhausted today."
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Waveform active />
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Analyzing</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { k: "Emotion", v: "Overwhelmed" },
                    { k: "Stress", v: "Medium" },
                    { k: "Conf.", v: "0.82" },
                  ].map((c) => (
                    <div key={c.k} className="border border-border p-3">
                      <div className="text-[9px] tracking-widest uppercase text-muted-foreground">{c.k}</div>
                      <div className="mt-1 text-sm">{c.v}</div>
                    </div>
                  ))}
                </div>
                <div className="border border-border p-3 text-sm text-muted-foreground">
                  "Let's take this one breath at a time. Try a brain dump on paper for five minutes."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-px bg-border">
          {[
            {
              k: "01",
              t: "NLP Analysis",
              d: "Tokenization, cleaning, and emotion classification across 8 emotional states with confidence scoring.",
            },
            {
              k: "02",
              t: "Safety Layer",
              d: "Deterministic crisis-phrase detection runs alongside ML inference and overrides flow when needed.",
            },
            {
              k: "03",
              t: "Solo Recommendations",
              d: "Mapped, low-risk, single-person actions: breathing, grounding, journaling, rest, hydration.",
            },
          ].map((m) => (
            <div key={m.k} className="bg-background p-8">
              <div className="text-[11px] tracking-widest text-muted-foreground">{m.k}</div>
              <div className="mt-2 text-lg font-medium">{m.t}</div>
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
