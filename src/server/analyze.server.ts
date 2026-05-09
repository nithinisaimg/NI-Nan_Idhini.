// Server-only helpers for the NI analysis pipeline.
// Calls an AI gateway with a constrained system prompt that returns structured JSON
// for emotion classification + supportive chatbot reply.

import type { Emotion } from "@/lib/recommendations";

export interface AIAnalysis {
  detected_emotion: Emotion;
  stress_level: "low" | "medium" | "high";
  confidence: number; // 0..1
  detected_keywords: string[];
  chatbot_reply: string;
}

function fallbackAnalysis(message: string): AIAnalysis {
  return {
    detected_emotion: "stressed",
    stress_level: "medium",
    confidence: 0.4,
    detected_keywords: [],
    chatbot_reply: message,
  };
}

const EMOTION_HINTS: Record<Emotion, string[]> = {
  anxious: ["anxious", "anxiety", "panic", "nervous", "worried", "restless", "fear"],
  stressed: ["stressed", "pressure", "deadline", "tense", "burdened"],
  overwhelmed: ["overwhelmed", "too much", "can't handle", "flooded", "swamped"],
  sad: ["sad", "down", "hopeless", "cry", "empty", "depressed"],
  lonely: ["lonely", "alone", "isolated", "left out", "no one"],
  angry: ["angry", "mad", "furious", "irritated", "frustrated", "rage"],
  exhausted: ["exhausted", "drained", "tired", "burned out", "fatigued", "sleepy"],
  calm: ["calm", "okay", "fine", "peaceful", "stable", "better", "relaxed", "happy", "joyful"],
};

const EMOTION_ALIASES: Record<string, Emotion> = {
  happy: "calm",
  happiness: "calm",
  joyful: "calm",
  joy: "calm",
  content: "calm",
  positive: "calm",
  neutral: "calm",
  burnt: "exhausted",
  burnout: "exhausted",
  depressed: "sad",
  frustration: "angry",
};

const SYSTEM_PROMPT = `You are NI (Nan Idhini), an AI mental wellness support assistant. You are not a doctor and never diagnose.
Analyze the user's free-text input and return ONLY a JSON object via the provided tool. Tone: calm, respectful, non-judgmental, concise.

Rules:
- Pick exactly ONE emotion from: anxious, stressed, overwhelmed, sad, lonely, angry, exhausted, calm.
- stress_level reflects intensity of distress (calm => low).
- confidence is your own 0-1 estimate.
- detected_keywords: 2-5 short phrases from the user's text that drove the prediction.
- chatbot_reply: 2-4 sentences. Acknowledge feelings, reflect back, do NOT diagnose, do NOT promise a cure, do NOT recommend group activity. Suggest the user can try a small solo step.
`;

export async function analyzeText(text: string): Promise<AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not configured, using fallback response");
    return analyzeLocally(text);
  }

  try {
    const models = (process.env.GEMINI_MODELS ?? "gemini-2.0-flash-lite,gemini-2.0-flash")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const configuredUrl = process.env.GEMINI_API_URL;

    for (const model of models) {
      const apiUrl = new URL(
        configuredUrl ??
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      );
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey.startsWith("AIza")) {
        apiUrl.searchParams.set("key", apiKey);
      } else {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const res = await fetch(apiUrl.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 520,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("AI gateway error", { model, status: res.status, body: t });
        if ([404, 429, 500, 502, 503, 504].includes(res.status)) continue;
        break;
      }

      const json = await res.json();
      const responseText = String(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
      if (!responseText) continue;

      const parsed = parseFirstJson(responseText) as Record<string, unknown>;
      return {
        detected_emotion: normalizeEmotion(parsed.detected_emotion),
        stress_level: normalizeStress(parsed.stress_level),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
        detected_keywords: Array.isArray(parsed.detected_keywords)
          ? (parsed.detected_keywords as unknown[]).map((k) => String(k)).slice(0, 5)
          : [],
        chatbot_reply: String(parsed.chatbot_reply || ""),
      };
    }

    return analyzeLocally(text);
  } catch (error) {
    console.error("analyzeText fallback due to error", error);
    return analyzeLocally(text);
  }
}

function analyzeLocally(text: string): AIAnalysis {
  const normalized = text.toLowerCase();
  let best: Emotion = "stressed";
  let score = 0;

  for (const [emotion, hints] of Object.entries(EMOTION_HINTS) as [Emotion, string[]][]) {
    const matched = hints.filter((h) => normalized.includes(h)).length;
    if (matched > score) {
      best = emotion;
      score = matched;
    }
  }

  const stress_level =
    best === "calm"
      ? "low"
      : best === "overwhelmed" || best === "angry" || best === "anxious"
        ? "high"
        : "medium";

  return {
    detected_emotion: best,
    stress_level,
    confidence: Math.max(0.35, Math.min(0.78, 0.42 + score * 0.08)),
    detected_keywords: extractEmotionKeywords(text).slice(0, 5),
    chatbot_reply:
      best === "calm"
        ? "I'm glad you're noticing a calmer moment. Try to protect this state for a few minutes with one gentle solo action and a slow breath."
        : `I hear you, and it makes sense to feel ${best} right now. Let's keep this simple and gentle for the next few minutes, then check in again after one small solo step.`,
  };
}

function extractEmotionKeywords(text: string): string[] {
  const normalized = text.toLowerCase();
  const candidates = new Set<string>();

  for (const hints of Object.values(EMOTION_HINTS)) {
    for (const hint of hints) {
      if (hint.length === 0) continue;
      const pattern = new RegExp(`\\b${hint.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (pattern.test(normalized)) {
        candidates.add(hint);
      }
    }
  }

  for (const [alias, emotion] of Object.entries(EMOTION_ALIASES)) {
    const pattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (pattern.test(normalized)) {
      candidates.add(alias);
    }
  }

  return Array.from(candidates);
}

function normalizeEmotion(value: unknown): Emotion {
  const v = String(value || "").toLowerCase();
  if (v in EMOTION_ALIASES) return EMOTION_ALIASES[v];
  if (v in EMOTION_HINTS) return v as Emotion;
  return "stressed";
}

function normalizeStress(value: unknown): "low" | "medium" | "high" {
  const v = String(value || "").toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function parseFirstJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI returned an unparseable text response");
  }
  return JSON.parse(match[0]);
}
