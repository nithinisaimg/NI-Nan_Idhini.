import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeText } from "./analyzeText";
import { detectCrisis } from "@/lib/crisis";
import { recommendationsFor, type Recommendation } from "@/lib/recommendations";

export interface AnalyzeResponse {
  detected_emotion: string;
  stress_level: "low" | "medium" | "high";
  confidence_score: number;
  detected_keywords: string[];
  analysis_summary: string;
  risk_flag: boolean;
  chatbot_reply: string;
  solo_recommendations: Recommendation[];
  emergency_notice?: string;
}

const InputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2, "Please share a little more.")
    .max(2000, "Please keep it under 2000 characters."),
});

const EMERGENCY_NOTICE =
  "What you wrote suggests you may be in serious distress. Please reach out to a crisis line, a mental health professional, or someone you trust right now. If you are in immediate danger, contact local emergency services. You do not have to handle this alone.";

export const analyzeEmotion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalyzeResponse> => {
    const crisis = detectCrisis(data.text);

    // Always run AI for empathic reply, but override flow on crisis.
    const ai = await analyzeText(data.text);

    if (crisis.risk) {
      return {
        detected_emotion: ai.detected_emotion,
        stress_level: "high",
        confidence_score: computeConfidence(
          "high",
          crisis.matched.length + ai.detected_keywords.length,
          data.text.length,
        ),
        detected_keywords: Array.from(new Set([...crisis.matched, ...ai.detected_keywords])),
        risk_flag: true,
        analysis_summary: ai.analysis_summary,
        chatbot_reply:
          "I'm really glad you told me. Your safety matters more than anything else right now. Please consider reaching out to a crisis service or someone you trust.",
        solo_recommendations: [],
        emergency_notice: EMERGENCY_NOTICE,
      };
    }

    return {
      detected_emotion: ai.detected_emotion,
      stress_level: ai.stress_level,
      confidence_score: computeConfidence(
        ai.stress_level,
        ai.detected_keywords.length,
        data.text.length,
      ),
      detected_keywords: ai.detected_keywords,
      analysis_summary: ai.analysis_summary,
      risk_flag: false,
      chatbot_reply: ai.chatbot_reply,
      solo_recommendations: recommendationsFor(ai.detected_emotion),
    };
  });

function computeConfidence(
  stress: "low" | "medium" | "high",
  keywordCount: number,
  textLength: number,
): number {
  const base = stress === "high" ? 0.82 : stress === "medium" ? 0.68 : 0.55;
  const keywordBoost = Math.min(keywordCount, 6) * 0.02;
  const lengthFactor =
    textLength < 15 ? -0.15 : textLength < 40 ? -0.05 : textLength > 180 ? 0.04 : 0;
  const score = base + keywordBoost + lengthFactor;
  return Math.max(0.3, Math.min(0.97, Number(score.toFixed(2))));
}
