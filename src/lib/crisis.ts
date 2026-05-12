// Crisis & safety keyword detection layer.
// Runs locally before/alongside ML inference to ensure deterministic safety override.

const CRISIS_PATTERNS: RegExp[] = [
  /\bkill (myself|me)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend (my|this) life\b/i,
  /\bend it all\b/i,
  /\bdon'?t want to (live|be alive|exist)\b/i,
  /\bwant to die\b/i,
  /\b(self[- ]?harm|cut myself|hurt myself)\b/i,
  /\bno reason to live\b/i,
  /\bcan'?t go on\b/i,
  /\bharm (someone|others)\b/i,
  /\boverdose\b/i,
  /\bjump off\b/i,
];

export interface CrisisResult {
  risk: boolean;
  matched: string[];
}

export function detectCrisis(text: string): CrisisResult {
  const matched: string[] = [];
  for (const re of CRISIS_PATTERNS) {
    const m = text.match(re);
    if (m) matched.push(m[0].toLowerCase());
  }
  return { risk: matched.length > 0, matched: Array.from(new Set(matched)) };
}
