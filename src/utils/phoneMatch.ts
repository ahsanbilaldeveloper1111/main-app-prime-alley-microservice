export const normalizePhoneValue = (value: unknown): string => {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'bigint') return String(value).trim();
    return '';
  };
  
  export const normalizePhoneDigits = (value: unknown): string =>
    normalizePhoneValue(value).replaceAll(/\D/g, '');
  
  export const isExactPhoneMatch = (candidate: unknown, target: string): boolean => {
    const normalizedTarget = normalizePhoneValue(target);
    if (!normalizedTarget) return true;
  
    const normalizedCandidate = normalizePhoneValue(candidate);
    if (normalizedCandidate === normalizedTarget) return true;
  
    const targetDigits = normalizePhoneDigits(normalizedTarget);
    const candidateDigits = normalizePhoneDigits(normalizedCandidate);
    return Boolean(targetDigits) && Boolean(candidateDigits) && targetDigits === candidateDigits;
  };
  