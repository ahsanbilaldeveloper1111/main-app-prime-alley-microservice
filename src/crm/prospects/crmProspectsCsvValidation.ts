const prospectsUploadCsvMaxBytes = 2 * 1024 * 1024;

export type ProspectsCsvValidationResult = {
  isValid: boolean;
  errors: string[];
};

/** Validates a CSV file before prospects bulk upload. */
export function validateProspectsUploadCsvFile(
  file: File,
): ProspectsCsvValidationResult {
  const errors: string[] = [];

  if (
    !file.type.includes("csv") &&
    !file.name.toLowerCase().endsWith(".csv")
  ) {
    errors.push("File must be a CSV file");
  }

  if (file.size > prospectsUploadCsvMaxBytes) {
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
