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

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) {
    const code = ch.codePointAt(0) ?? 0;
    hash = code + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 55%, 45%, 0.6)`;
}
