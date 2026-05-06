import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeText } from "./analyze.server";
import { detectCrisis } from "@/lib/crisis";
import { recommendationsFor, type Recommendation } from "@/lib/recommendations";

export interface AnalyzeResponse {
  detected_emotion: string;
  stress_level: "low" | "medium" | "high";
  confidence_score: number;
  detected_keywords: string[];
  risk_flag: boolean;
  chatbot_reply: string;
  solo_recommendations: Recommendation[];
  emergency_notice?: string;
}

const InputSchema = z.object({
  text: z.string().trim().min(2, "Please share a little more.").max(2000, "Please keep it under 2000 characters."),
});

const EMERGENCY_NOTICE =
  "What you wrote suggests you may be in serious distress. Please reach out to a crisis line, a mental health professional, or someone you trust right now. If you are in immediate danger, contact local emergency services. You do not have to handle this alone.";

export const analyzeEmotion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AnalyzeResponse> => {
    const crisis = detectCrisis(data.text);

    // Always run AI for empathic reply, but override flow on crisis.
    let ai;
    try {
      ai = await analyzeText(data.text);
    } catch (e) {
      console.error("analyze error", e);
      // Fallback so UI never breaks
      ai = {
        detected_emotion: "stressed" as const,
        stress_level: "medium" as const,
        confidence: 0.4,
        detected_keywords: [],
        chatbot_reply:
          "I hear you. I'm having trouble processing fully right now, but your feelings are valid. Try one slow breath while we continue.",
      };
    }

    if (crisis.risk) {
      return {
        detected_emotion: ai.detected_emotion,
        stress_level: "high",
        confidence_score: Math.max(ai.confidence, 0.9),
        detected_keywords: Array.from(new Set([...crisis.matched, ...ai.detected_keywords])),
        risk_flag: true,
        chatbot_reply:
          "I'm really glad you told me. Your safety matters more than anything else right now. Please consider reaching out to a crisis service or someone you trust.",
        solo_recommendations: [],
        emergency_notice: EMERGENCY_NOTICE,
      };
    }

    return {
      detected_emotion: ai.detected_emotion,
      stress_level: ai.stress_level,
      confidence_score: ai.confidence,
      detected_keywords: ai.detected_keywords,
      risk_flag: false,
      chatbot_reply: ai.chatbot_reply,
      solo_recommendations: recommendationsFor(ai.detected_emotion),
    };
  });
