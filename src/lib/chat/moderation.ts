/**
 * Lightweight profanity + spam heuristics.
 * Runs on the client before send; the database enforces length + rate limits.
 */

const BLOCKED = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "slut",
  "whore", "faggot", "retard", "nigger", "wanker", "prick", "twat",
];

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i",
};

function normalize(word: string) {
  return word
    .toLowerCase()
    .split("")
    .map((c) => LEET[c] ?? c)
    .join("")
    .replace(/[^a-z]/g, "");
}

export function containsProfanity(text: string) {
  return text.split(/\s+/).some((w) => {
    const n = normalize(w);
    return BLOCKED.some((bad) => n.includes(bad));
  });
}

export function censor(text: string) {
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim()) return token;
      const n = normalize(token);
      return BLOCKED.some((bad) => n.includes(bad)) ? "*".repeat(Math.max(3, token.length)) : token;
    })
    .join("");
}

export type SpamVerdict = { ok: true } | { ok: false; reason: string };

export function checkSpam(text: string, recentTimestamps: number[]): SpamVerdict {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "Write something first." };
  if (trimmed.length > 500) return { ok: false, reason: "Messages are capped at 500 characters." };

  const window = recentTimestamps.filter((t) => Date.now() - t < 5000);
  if (window.length >= 3) return { ok: false, reason: "Slow down — 3 messages per 5 seconds." };

  if (/(.)\1{14,}/.test(trimmed)) return { ok: false, reason: "That looks like keyboard spam." };

  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 12 && letters === letters.toUpperCase()) {
    return { ok: false, reason: "Please don't shout in all caps." };
  }
  return { ok: true };
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return "yesterday";
}

export function absoluteTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function hoursLeft(iso: string) {
  const ms = new Date(iso).getTime() + 24 * 3600_000 - Date.now();
  return Math.max(0, Math.ceil(ms / 3600_000));
}
