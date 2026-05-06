// Solo self-calming recommendation mapping per detected emotion.
// Mostly low-risk, single-person actions.

export type Emotion =
  | "anxious"
  | "stressed"
  | "overwhelmed"
  | "sad"
  | "lonely"
  | "angry"
  | "exhausted"
  | "calm";

export interface Recommendation {
  title: string;
  detail: string;
  duration: string;
}

const RECS: Record<Emotion, Recommendation[]> = {
  anxious: [
    { title: "Box breathing", detail: "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 6 cycles.", duration: "2 min" },
    { title: "5-4-3-2-1 grounding", detail: "Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.", duration: "3 min" },
    { title: "Cold water reset", detail: "Splash cool water on your face or hold something cold for 30 seconds.", duration: "1 min" },
  ],
  stressed: [
    { title: "Slow exhale breathing", detail: "Inhale 4s, exhale 8s. Lengthen the out-breath. 10 cycles.", duration: "3 min" },
    { title: "Single-task pause", detail: "Pick one item from your list. Close everything else for the next 10 minutes.", duration: "10 min" },
    { title: "Stretch + water", detail: "Stand, roll shoulders, stretch your neck, drink a glass of water.", duration: "2 min" },
  ],
  overwhelmed: [
    { title: "Brain dump on paper", detail: "Write every thought, no filter, for 5 minutes. Then circle one small thing to do.", duration: "5 min" },
    { title: "Reduce stimulation", detail: "Lower brightness, mute notifications, sit in quiet for a moment.", duration: "5 min" },
    { title: "One-step rule", detail: "Identify the smallest next step. Do only that.", duration: "varies" },
  ],
  sad: [
    { title: "Gentle journaling", detail: "Write what you feel without trying to fix it. Three sentences are enough.", duration: "5 min" },
    { title: "Warm pause", detail: "A warm drink, slow sips, soft light. Let your body settle.", duration: "10 min" },
    { title: "Tiny gratitude", detail: "Note one small thing that didn't go badly today.", duration: "1 min" },
  ],
  lonely: [
    { title: "Self check-in note", detail: "Write yourself a short, kind message like you would to a friend.", duration: "3 min" },
    { title: "Familiar comfort", detail: "Re-watch, re-read, or re-listen to something that feels safe.", duration: "20 min" },
    { title: "Light a small ritual", detail: "Make tea, light a candle, sit by a window for a few minutes.", duration: "10 min" },
  ],
  angry: [
    { title: "Physical release", detail: "Push against a wall hard for 10 seconds. Repeat 3 times. Releases tension safely.", duration: "2 min" },
    { title: "Long exhale breathing", detail: "Exhale longer than you inhale for 2 minutes.", duration: "2 min" },
    { title: "Pause before responding", detail: "Set a 20 minute timer before replying to whoever or whatever triggered this.", duration: "20 min" },
  ],
  exhausted: [
    { title: "10 minute rest", detail: "Lie flat, close your eyes, no screen. Just rest, even without sleep.", duration: "10 min" },
    { title: "Hydrate + slow snack", detail: "Water and something light. Mental fatigue often hides physical needs.", duration: "5 min" },
    { title: "Bedtime calming", detail: "Dim lights 30 min before sleep. Keep the phone out of reach.", duration: "30 min" },
  ],
  calm: [
    { title: "Notice the calm", detail: "Pause and acknowledge that this state is real. Anchor it with a slow breath.", duration: "1 min" },
    { title: "Light reflection", detail: "Write one line about what helped you arrive here.", duration: "2 min" },
    { title: "Protect the state", detail: "Avoid the next stimulating thing for a few minutes. Let it last.", duration: "5 min" },
  ],
};

export function recommendationsFor(emotion: string): Recommendation[] {
  const key = (emotion?.toLowerCase() as Emotion) || "stressed";
  return RECS[key] || RECS.stressed;
}
