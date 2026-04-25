const crmListUploadCsvMaxBytes = 2 * 1024 * 1024;

export type CrmListCsvValidationResult = {
  isValid: boolean;
  errors: string[];
};

const BLOCKED_UPLOAD_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".pif",
  ".dll",
  ".app",
  ".deb",
  ".rpm",
  ".sh",
  ".ps1",
  ".vbs",
] as const;

/** Validates a CSV file before CRM list bulk upload (contacts, prospects, etc.). */
export function validateCrmListUploadCsvFile(
  file: File,
): CrmListCsvValidationResult {
  const errors: string[] = [];

  const lowerName = file.name.toLowerCase();
  if (BLOCKED_UPLOAD_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    errors.push("This file type is not allowed. Please upload a CSV file only.");
  }

  if (
    !file.type.includes("csv") &&
    !file.name.toLowerCase().endsWith(".csv")
  ) {
    errors.push("File must be a CSV file");
  }

  if (file.size > crmListUploadCsvMaxBytes) {
    errors.push("File size must be less than 2MB");
  }

  if (file.size === 0) {
    errors.push("File cannot be empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
