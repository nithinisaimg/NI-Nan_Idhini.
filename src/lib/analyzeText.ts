import type { Emotion } from "@/lib/recommendations";

export interface AIAnalysis {
  detected_emotion: Emotion;
  stress_level: "low" | "medium" | "high";
  confidence: number;
  detected_keywords: string[];
  analysis_summary: string;
  chatbot_reply: string;
}

function fallbackAnalysis(message: string): AIAnalysis {
  return {
    detected_emotion: "stressed",
    stress_level: "medium",
    confidence: 0.4,
    detected_keywords: [],
    analysis_summary: "The fallback model could not access the AI service, so it used a local heuristic-based prediction.",
    chatbot_reply: message,
  };
}

const EMOTION_HINTS: Record<Emotion, string[]> = {
  anxious: [
    "anxious",
    "anxiety",
    "panic",
    "nervous",
    "worried",
    "restless",
    "fear",
    "uneasy",
    "apprehensive",
    "jittery",
    "on edge",
    "tense",
    "fretful",
    "overthinking",
    "racing thoughts",
  ],
  stressed: [
    "stressed",
    "pressure",
    "deadline",
    "tense",
    "burdened",
    "overloaded",
    "stretched thin",
    "under pressure",
    "burnt out",
    "overwhelmed",
    "frantic",
    "rushed",
    "hectic",
  ],
  overwhelmed: [
    "overwhelmed",
    "too much",
    "can't handle",
    "flooded",
    "swamped",
    "drowning",
    "inundated",
    "paralyzed",
    "frozen",
    "lost",
    "chaotic",
    "disorganized",
  ],
  sad: [
    "sad",
    "down",
    "hopeless",
    "cry",
    "empty",
    "depressed",
    "blue",
    "melancholy",
    "gloomy",
    "heartbroken",
    "grieving",
    "low",
    "miserable",
    "despair",
  ],
  lonely: [
    "lonely",
    "alone",
    "isolated",
    "left out",
    "no one",
    "abandoned",
    "disconnected",
    "solitary",
    "friendless",
    "homesick",
    "alienated",
    "excluded",
  ],
  angry: [
    "angry",
    "mad",
    "furious",
    "irritated",
    "frustrated",
    "rage",
    "enraged",
    "livid",
    "annoyed",
    "pissed off",
    "resentful",
    "bitter",
    "hostile",
  ],
  exhausted: [
    "exhausted",
    "drained",
    "tired",
    "burned out",
    "fatigued",
    "sleepy",
    "weary",
    "worn out",
    "spent",
    "zapped",
    "lethargic",
    "sluggish",
    "run down",
  ],
  calm: [
    "calm",
    "okay",
    "fine",
    "peaceful",
    "stable",
    "better",
    "relaxed",
    "happy",
    "joyful",
    "content",
    "serene",
    "tranquil",
    "at ease",
    "balanced",
    "composed",
  ],
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
Analyze the user's free-text input and return ONLY a JSON object via the provided tool. Tone: calm, respectful, non-judgmental, thoughtful, and supportive.

Rules:
- Pick exactly ONE emotion from: anxious, stressed, overwhelmed, sad, lonely, angry, exhausted, calm.
- stress_level reflects intensity of distress (calm => low). Calculate based on cue count and emotional intensity.
- confidence is your own 0-1 estimate based on cue strength and clarity.
- detected_keywords: 3-6 short phrases from the user's text that drove the prediction, prioritizing most dangerous/health-effective cues first (crisis indicators > high distress > medium distress > low distress).
- analysis_summary: 1-2 short sentences explaining why this emotion was detected, highlighting the most significant cue and how cue count influenced stress level assessment.
- chatbot_reply: 3-5 sentences. Acknowledge feelings deeply, reflect back thoughtfully by referencing specific cues from detected_keywords, explore gentle connections to related feelings or situations, do NOT diagnose, do NOT promise a cure, do NOT recommend group activity. Suggest the user can try a small solo step and encourage checking in later.
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
          ? (parsed.detected_keywords as unknown[]).map((k) => String(k)).slice(0, 6)
          : [],
        analysis_summary: String(parsed.analysis_summary || ""),
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

  // Extract keywords with priority scoring
  const keywordAnalysis = extractEmotionKeywordsWithPriority(text);
  const keywords = keywordAnalysis.keywords;
  const cueCount = keywords.length;

  // Calculate stress level based on cue count and priority
  const stress_level = calculateStressLevel(cueCount, keywordAnalysis.priorityScore, normalized);

  // Determine emotion based on highest priority cues
  const detected_emotion = determineEmotionFromCues(keywords, normalized);

  return {
    detected_emotion,
    stress_level,
    confidence: Math.max(0.35, Math.min(0.95, 0.45 + cueCount * 0.08 + keywordAnalysis.priorityScore * 0.05)),
    detected_keywords: keywords,
    analysis_summary: generateLocalExplanation(detected_emotion, stress_level, keywords, keywordAnalysis.topPriorityCue),
    chatbot_reply:
      detected_emotion === "calm"
        ? "I'm glad you're noticing a calmer moment. Try to protect this state for a few minutes with one gentle solo action and a slow breath."
        : `I hear you, and it makes sense to feel ${detected_emotion} right now. Let's keep this simple and gentle for the next few minutes, then check in again after one small solo step.`,
  };
}

function calculateStressLevel(cueCount: number, priorityScore: number, text: string): "low" | "medium" | "high" {
  // Base stress on cue count
  let stressScore = 0;

  if (cueCount >= 4) stressScore += 3; // High cue density
  else if (cueCount >= 2) stressScore += 2; // Medium cue density
  else if (cueCount >= 1) stressScore += 1; // Low cue density

  // Add priority score (dangerous cues increase stress)
  stressScore += priorityScore;

  // Check for intensity modifiers
  const intensityWords = ["very", "extremely", "so", "really", "terribly", "awfully"];
  const hasIntensity = intensityWords.some(word => text.includes(word));
  if (hasIntensity) stressScore += 1;

  // Check for crisis indicators
  const crisisWords = ["suicide", "kill", "die", "end it", "hurt myself", "can't go on"];
  const hasCrisis = crisisWords.some(word => text.includes(word));
  if (hasCrisis) stressScore += 3;

  // Determine final stress level
  if (stressScore >= 5 || hasCrisis) return "high";
  if (stressScore >= 3) return "medium";
  return "low";
}

function determineEmotionFromCues(keywords: string[], text: string): Emotion {
  if (keywords.length === 0) return "stressed";

  // Priority-based emotion detection
  const emotionScores: Record<Emotion, number> = {
    anxious: 0, stressed: 0, overwhelmed: 0, sad: 0, lonely: 0, angry: 0, exhausted: 0, calm: 0
  };

  // Score emotions based on detected keywords
  for (const keyword of keywords) {
    for (const [emotion, hints] of Object.entries(EMOTION_HINTS) as [Emotion, string[]][]) {
      if (hints.includes(keyword)) {
        emotionScores[emotion] += 1;
      }
    }
  }

  // Find emotion with highest score
  let bestEmotion: Emotion = "stressed";
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(emotionScores) as [Emotion, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestEmotion = emotion;
    }
  }

  return bestEmotion;
}

interface KeywordAnalysis {
  keywords: string[];
  priorityScore: number;
  topPriorityCue: string;
}

function extractEmotionKeywordsWithPriority(text: string): KeywordAnalysis {
  const normalized = text.toLowerCase();
  const candidates = new Map<string, number>(); // keyword -> priority score

  // Define priority levels for different types of cues
  const CRISIS_CUES = ["suicide", "kill", "die", "end it", "hurt myself", "can't go on", "hopeless"];
  const HIGH_PRIORITY_CUES = ["panic", "terrified", "overwhelmed", "despair", "rage", "furious", "exhausted"];
  const MEDIUM_PRIORITY_CUES = ["anxious", "stressed", "depressed", "lonely", "angry", "sad"];
  const LOW_PRIORITY_CUES = ["worried", "tired", "frustrated", "upset", "down"];

  // Extract keywords with priority scoring
  for (const hints of Object.values(EMOTION_HINTS)) {
    for (const hint of hints) {
      if (hint.length === 0) continue;
      const pattern = new RegExp(`\\b${hint.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (pattern.test(normalized) && !isFragmentOrFiller(normalized, hint)) {
        let priority = 1; // Base priority

        if (CRISIS_CUES.includes(hint)) priority = 5;
        else if (HIGH_PRIORITY_CUES.includes(hint)) priority = 4;
        else if (MEDIUM_PRIORITY_CUES.includes(hint)) priority = 3;
        else if (LOW_PRIORITY_CUES.includes(hint)) priority = 2;

        candidates.set(hint, priority);
      }
    }
  }

  // Sort by priority (highest first) then alphabetically
  const sortedKeywords = Array.from(candidates.entries())
    .sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1]; // Higher priority first
      return a[0].localeCompare(b[0]); // Alphabetical for same priority
    })
    .map(([keyword]) => keyword)
    .slice(0, 6);

  // Calculate total priority score
  const priorityScore = Array.from(candidates.values()).reduce((sum, score) => sum + score, 0);

  // Find top priority cue
  const topPriorityCue = sortedKeywords.length > 0 ? sortedKeywords[0] : "";

  return {
    keywords: sortedKeywords,
    priorityScore,
    topPriorityCue
  };
}

function generateLocalExplanation(
  emotion: Emotion,
  stress_level: "low" | "medium" | "high",
  keywords: string[],
  topPriorityCue: string,
): string {
  const cues = keywords.length > 0 ? `from terms like ${keywords.join(", ")}` : "from the overall tone";
  const intensity =
    stress_level === "high"
      ? "The language indicates high distress with strong emotional signals."
      : stress_level === "medium"
      ? "The tone suggests moderate stress with clear emotional indicators."
      : "The tone appears calm with minimal stress indicators.";

  const priorityNote = topPriorityCue
    ? ` The most significant cue detected was "${topPriorityCue}".`
    : "";

  return `The model detected ${emotion} ${cues}. ${intensity}${priorityNote}`;
}

function extractEmotionKeywords(text: string): string[] {
  const normalized = text.toLowerCase();
  const candidates = new Set<string>();

  // Extract ONLY standalone emotional states (EMOTION_HINTS)
  for (const hints of Object.values(EMOTION_HINTS)) {
    for (const hint of hints) {
      if (hint.length === 0) continue;
      // Use word boundaries to match only standalone words, not fragments
      const pattern = new RegExp(`\\b${hint.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (pattern.test(normalized)) {
        // Verify it's not preceded or followed by filler words
        if (!isFragmentOrFiller(normalized, hint)) {
          candidates.add(hint);
        }
      }
    }
  }

  // Extract emotion aliases (alternative emotion keywords)
  for (const [alias, emotion] of Object.entries(EMOTION_ALIASES)) {
    const pattern = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (pattern.test(normalized)) {
      if (!isFragmentOrFiller(normalized, alias)) {
        candidates.add(alias);
      }
    }
  }

  // Return unique emotional keywords only (no thematic phrases)
  return Array.from(candidates).slice(0, 6);
}

function isFragmentOrFiller(text: string, keyword: string): boolean {
  // Filler words and connectors that should be ignored before/after emotion keywords
  const fillerWords = [
    "feeling",
    "feel",
    "am",
    "is",
    "are",
    "was",
    "were",
    "been",
    "very",
    "so",
    "bit",
    "kind",
    "sort",
    "like",
    "more",
    "less",
    "and",
    "or",
    "but",
    "a",
    "an",
    "the",
  ];

  // Create pattern to check if keyword is surrounded only by filler/connectors
  const escapedKeyword = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const beforePattern = new RegExp(`(${fillerWords.join("|")})\\s+${escapedKeyword}\\b`, "i");
  const afterPattern = new RegExp(`\\b${escapedKeyword}\\s+(${fillerWords.join("|")})`, "i");

  // Allow the keyword only if it's standalone (not just after a filler word)
  const hasFillerBefore = beforePattern.test(text);
  const hasFillerAfter = afterPattern.test(text);

  // If it ONLY appears with fillers or as a fragment, reject it
  const standalonePattern = new RegExp(`(^|[^a-z])${escapedKeyword}([^a-z]|$)`, "i");
  const hasStandalone = standalonePattern.test(text);

  return !hasStandalone || (hasFillerBefore && hasFillerAfter);
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
