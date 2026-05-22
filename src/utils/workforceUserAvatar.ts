/** Shared initials / avatar tint for workforce tables and sidebars. */

export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "NA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

const AVATAR_PALETTE = [
  "#1a6fbd", "#0e7490", "#0f766e", "#1d4ed8",
  "#4f46e5", "#7c3aed", "#0369a1", "#065f46",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) {
    const code = ch.codePointAt(0) ?? 0;
    hash = code + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
