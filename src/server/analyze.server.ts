// Server-only helpers for the NI analysis pipeline.
// Calls Lovable AI Gateway with a constrained system prompt that returns structured JSON
// for emotion classification + supportive chatbot reply.

import type { Emotion } from "@/lib/recommendations";

export interface AIAnalysis {
  detected_emotion: Emotion;
  stress_level: "low" | "medium" | "high";
  confidence: number; // 0..1
  detected_keywords: string[];
  chatbot_reply: string;
}

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
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Return structured wellness analysis.",
            parameters: {
              type: "object",
              properties: {
                detected_emotion: {
                  type: "string",
                  enum: ["anxious", "stressed", "overwhelmed", "sad", "lonely", "angry", "exhausted", "calm"],
                },
                stress_level: { type: "string", enum: ["low", "medium", "high"] },
                confidence: { type: "number" },
                detected_keywords: { type: "array", items: { type: "string" } },
                chatbot_reply: { type: "string" },
              },
              required: ["detected_emotion", "stress_level", "confidence", "detected_keywords", "chatbot_reply"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    throw new Error("AI service error");
  }

  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  const args = call?.function?.arguments;
  if (!args) throw new Error("AI returned no structured result");
  const parsed = typeof args === "string" ? JSON.parse(args) : args;

  return {
    detected_emotion: parsed.detected_emotion,
    stress_level: parsed.stress_level,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    detected_keywords: Array.isArray(parsed.detected_keywords) ? parsed.detected_keywords.slice(0, 5) : [],
    chatbot_reply: String(parsed.chatbot_reply || ""),
  };
}
