export function formatLayoutPhoneNumber(number: string): string {
  if (number.startsWith("+")) {
    return number;
  }

  const digits = number.replaceAll(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return number;
}
