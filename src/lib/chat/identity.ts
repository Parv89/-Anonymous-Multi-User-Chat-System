const ADJECTIVES = [
  "Silent", "Neon", "Cyber", "Velvet", "Hidden", "Quiet", "Static", "Midnight",
  "Glass", "Feral", "Lucid", "Amber", "Hollow", "Rogue", "Frost", "Ember",
  "Paper", "Cobalt", "Drifting", "Nameless",
];

const CREATURES = [
  "Panda", "Fox", "Owl", "Otter", "Raven", "Moth", "Wolf", "Heron",
  "Lynx", "Koi", "Falcon", "Badger", "Gecko", "Stag", "Crane", "Viper",
  "Hare", "Orca", "Ibis", "Mole",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function generateAlias() {
  return `${pick(ADJECTIVES)}${pick(CREATURES)}${Math.floor(Math.random() * 90) + 10}`;
}

export function generateSessionId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hashSeed(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic gradient for an anonymous avatar. */
export function avatarGradient(seed: string) {
  const h = hashSeed(seed);
  const a = h % 360;
  const b = (a + 40 + (h % 90)) % 360;
  return `linear-gradient(135deg, oklch(0.72 0.16 ${a}), oklch(0.55 0.18 ${b}))`;
}

export function initials(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  const caps = letters.match(/[A-Z]/g);
  if (caps && caps.length >= 2) return caps.slice(0, 2).join("");
  return letters.slice(0, 2).toUpperCase() || "AN";
}
