/**
 * Guardrail helpers — unified error format so the frontend can always offer
 * "Log a support ticket" when an action is blocked.
 */

export interface GuardrailError {
  code: "GUARDRAIL";
  message: string;
  action?: string;       // short label for the blocked action (pre-fills ticket title)
  canLogTicket: true;
}

export function guardrailError(message: string, action?: string): { status: 403; body: GuardrailError } {
  return {
    status: 403,
    body: { code: "GUARDRAIL", message, action, canLogTicket: true },
  };
}

// ── Per-user skill rate limiter ────────────────────────────────────────────
// Simple in-memory sliding window: max MAX_CALLS per WINDOW_MS per user.
const MAX_CALLS = 60;
const WINDOW_MS = 60_000; // 1 minute

interface BucketEntry { count: number; windowStart: number }
const rateBuckets = new Map<string, BucketEntry>();

export function checkSkillRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateBuckets.set(userId, { count: 1, windowStart: now });
    return true; // allowed
  }

  if (entry.count >= MAX_CALLS) return false; // blocked

  entry.count++;
  return true;
}

// ── Agent cap ─────────────────────────────────────────────────────────────
export const MAX_AGENTS_PER_USER = 10;

// ── Approved external services (built-in integrations) ────────────────────
// These are the only external services a user may reference without admin approval.
export const APPROVED_SERVICES = new Set([
  "openai", "telegram", "twilio", "sms", "email", "imap", "smtp",
  "aeroapi", "flightaware", "open-meteo", "openmeteo", "weather",
  "calendar", "internal", "notes", "tasks",
]);

/**
 * Detects whether an automation description references services outside the
 * approved set. Returns an array of suspected external service names.
 */
export function detectExternalServices(text: string): string[] {
  const lower = text.toLowerCase();

  // URL pattern
  const urlMatches = lower.match(/https?:\/\/[^\s,)]+/g) || [];
  const externalUrls = urlMatches.filter(
    (u) => !u.includes("localhost") && !u.includes("127.0.0.1")
  );

  // Common third-party service keywords (not in approved list)
  const thirdPartyKeywords = [
    "zapier", "make.com", "ifttt", "webhook", "slack", "discord",
    "notion", "airtable", "hubspot", "salesforce", "stripe", "paypal",
    "shopify", "twitter", "facebook", "instagram", "linkedin", "tiktok",
    "google sheets", "google drive", "dropbox", "onedrive", "s3",
    "aws", "gcp", "azure", "firebase", "supabase", "mongodb",
    "twitch", "youtube", "reddit", "whatsapp",
  ];

  const found = thirdPartyKeywords.filter((kw) => lower.includes(kw));

  return [...externalUrls, ...found];
}
