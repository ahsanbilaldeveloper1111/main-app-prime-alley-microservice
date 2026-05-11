/** Stable React list keys when values may repeat (occurrence suffix disambiguates). */
export function withOccurrenceKeys<T>(
  items: T[],
  prefix: string,
  identity: (item: T) => string,
): { key: string; item: T }[] {
  const tallies = new Map<string, number>();
  return items.map((item) => {
    const part = identity(item);
    const next = (tallies.get(part) ?? 0) + 1;
    tallies.set(part, next);
    return { key: `${prefix}__${part}__${next}`, item };
  });
}
