import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeEmotion, type AnalyzeResponse } from "@/server/analyze.functions";
import { Waveform } from "@/components/waveform";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Session · NI" },
      { name: "description", content: "Describe how you feel. NI's NLP and ML pipeline returns a calm response and solo self-care steps." },
      { property: "og:title", content: "NI · Session" },
      { property: "og:description", content: "Open-access AI wellness session. No login." },
    ],
  }),
  component: ChatPage,
});

interface Turn {
  user: string;
  result?: AnalyzeResponse;
  error?: string;
  loading?: boolean;
}

function ChatPage() {
  const analyze = useServerFn(analyzeEmotion);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setText("");
    const idx = turns.length;
    setTurns((prev) => [...prev, { user: t, loading: true }]);
    try {
      const result = await analyze({ data: { text: t } });
      setTurns((prev) => prev.map((x, i) => (i === idx ? { user: t, result } : x)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setTurns((prev) => prev.map((x, i) => (i === idx ? { user: t, error: msg } : x)));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between border border-border px-4 py-3 bg-surface">
        <div className="flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
          <span className="h-1.5 w-1.5 bg-foreground pulse-dot" />
          ni.session · open
        </div>
        <Waveform active={busy} />
      </div>

      <div className="mt-6 space-y-8 min-h-[40vh]">
        {turns.length === 0 && (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Describe how you feel right now. Anything is fine — a sentence, a paragraph, a single word.
          </div>
        )}
        {turns.map((t, i) => (
          <TurnView key={i} turn={t} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-4 mt-10">
        <div className="border border-border bg-surface">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border text-[10px] tracking-widest uppercase text-muted-foreground">
            <span>Input</span>
            <span>{text.length}/2000</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Describe how you feel right now…"
            rows={3}
            className="w-full bg-transparent px-4 py-3 text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <div className="text-[10px] tracking-widest uppercase text-muted-foreground">⌘/Ctrl + Enter to send</div>
            <button
              onClick={submit}
              disabled={busy || text.trim().length < 2}
              className="border border-foreground bg-foreground text-background px-4 py-2 text-[11px] tracking-[0.25em] uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background hover:text-foreground transition"
            >
              {busy ? "Analyzing…" : "Send"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground text-center">
          Supportive guidance only. Not a diagnosis. Not an emergency service.
        </p>
      </div>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-4">
      {/* User */}
      <div className="flex justify-end">
        <div className="max-w-[85%] border border-border bg-surface-elevated px-4 py-3 text-sm">
          {turn.user}
        </div>
      </div>

      {/* Loading */}
      {turn.loading && (
        <div className="border border-border p-6 flex items-center gap-3">
          <Waveform active />
          <span className="text-[11px] tracking-widest uppercase text-muted-foreground">Processing input · ML inference</span>
        </div>
      )}

      {turn.error && (
        <div className="border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
          {turn.error}
        </div>
      )}

      {turn.result && <ResultView r={turn.result} />}
    </div>
  );
}

function ResultView({ r }: { r: AnalyzeResponse }) {
  return (
    <div className="space-y-4">
      {r.risk_flag && r.emergency_notice && (
        <div className="border border-foreground bg-foreground text-background p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-2 opacity-70">Safety override</div>
          <div className="text-sm leading-relaxed">{r.emergency_notice}</div>
          <div className="mt-4 grid sm:grid-cols-3 gap-2 text-[11px]">
            <a href="tel:112" className="border border-background/40 px-3 py-2 text-center hover:bg-background hover:text-foreground transition">Emergency · 112</a>
            <a href="tel:988" className="border border-background/40 px-3 py-2 text-center hover:bg-background hover:text-foreground transition">988 (US/CA)</a>
            <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="border border-background/40 px-3 py-2 text-center hover:bg-background hover:text-foreground transition">Find a helpline</a>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-px bg-border border border-border">
        <Stat k="Emotion" v={cap(r.detected_emotion)} />
        <Stat k="Stress" v={cap(r.stress_level)} accent={r.stress_level} />
        <Stat k="Confidence" v={`${Math.round(r.confidence_score * 100)}%`} />
      </div>

      {/* Reply */}
      <div className="border border-border p-5">
        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">NI · response</div>
        <div className="text-sm leading-relaxed">{r.chatbot_reply}</div>
        {r.detected_keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {r.detected_keywords.map((k, i) => (
              <span key={i} className="text-[10px] tracking-wider uppercase border border-border px-2 py-1 text-muted-foreground">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {r.solo_recommendations.length > 0 && (
        <div className="border border-border">
          <div className="px-5 py-3 border-b border-border text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Solo self-calming · try one
          </div>
          <div className="divide-y divide-border">
            {r.solo_recommendations.map((rec, i) => (
              <div key={i} className="p-5 flex gap-4">
                <div className="text-foreground/40 tabular-nums text-xs w-6 mt-0.5">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{rec.title}</div>
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground">{rec.duration}</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{rec.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: string }) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{k}</div>
      <div className="mt-2 text-base flex items-center gap-2">
        {accent && <span className={`h-1.5 w-1.5 ${accent === "high" ? "bg-destructive" : accent === "medium" ? "bg-foreground" : "bg-muted-foreground"}`} />}
        {v}
      </div>
    </div>
  );
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
