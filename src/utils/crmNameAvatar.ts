/** Initials for CRM avatar badges (first two words / first two letters, a–z only). */
export function getInitials(name: string): string {
  if (!name) return "NA";

  const words = name.trim().split(/\s+/).slice(0, 2);
  const hasSecondWord = words.length >= 2;
  const secondWordHasLetter = hasSecondWord && /[a-z]/i.test(words[1]);

  if (hasSecondWord && secondWordHasLetter) {
    const firstLetter1 = /[a-z]/i.exec(words[0])?.[0];
    const firstLetter2 = /[a-z]/i.exec(words[1])?.[0];

    if (firstLetter1 && firstLetter2) {
      return (firstLetter1 + firstLetter2).toUpperCase();
    }
  }

  if (words[0]) {
    const letters = words[0].match(/[a-z]/gi) || [];
    if (letters.length >= 2) {
      return (letters[0] + letters[1]).toUpperCase();
    }
    if (letters.length === 1) {
      return letters[0].toUpperCase();
    }
  }

  return "NA";
}

/** Non-crypto stable hash for UI bucketing (avatars, badge variants). Not for security. */
export function stableStringHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (input.codePointAt(i) || 0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/** Deterministic hsla color from a display name for avatar backgrounds. */
export function getRandomColor(name: string): string {
  if (!name) return "#6c757d";

  const hash = stableStringHash(name);
  const hue = hash % 360;
  const saturation = 50 + (hash % 30);
  const lightness = 40 + (hash % 20);

  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
}
