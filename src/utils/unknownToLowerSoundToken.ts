/**
 * Coerces API/socket values to a lowercased token without calling String() on objects
 * (which would yield "[object Object]").
 */
export function unknownToLowerSoundToken(raw: unknown): string | null {
  if (raw == null) {
    return null
  }
  if (typeof raw === 'string') {
    const text = raw.trim().toLowerCase()
    return text === '' ? null : text
  }
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return String(raw).trim().toLowerCase()
  }
  return null
}
