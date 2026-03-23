type GenericRecord = Record<string, unknown>;

const EMPTY_VALUE = "--";

const toPrimitiveText = (value: unknown, fallback = EMPTY_VALUE): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

export const formatCrmShortDate = (dateValue: string | null | undefined): string =>
  dateValue
    ? new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : EMPTY_VALUE;

export const formatCrmSummaryUpdatedLabel = (dateValue: string | null | undefined): string | undefined =>
  dateValue
    ? `Updated ${new Date(dateValue).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : undefined;

export const formatCrmAmount = (
  row: GenericRecord,
  options?: { currencyKey?: string; amountKeys?: string[] }
): string => {
  const currencyKey = options?.currencyKey ?? "currency";
  const amountKeys = options?.amountKeys ?? ["net_value", "grand_total"];
  const currency = row[currencyKey];
  const amount = amountKeys.map((key) => row[key]).find((value) => value != null && value !== "");
  const amountText = toPrimitiveText(amount);
  if (amountText === EMPTY_VALUE) return EMPTY_VALUE;

  const currencyText = toPrimitiveText(currency, "");
  return currencyText ? `${currencyText} ${amountText}` : amountText;
};

export const getCrmExtensionDisplayName = (
  rawValue: unknown,
  extensions: GenericRecord[],
  fallback: string = EMPTY_VALUE
): string => {
  if (rawValue == null || rawValue === "") return fallback;
  const rawValueText = toPrimitiveText(rawValue, "");
  if (!rawValueText) return fallback;

  const match = extensions.find(
    (ext) =>
      toPrimitiveText(ext.id, "") === rawValueText ||
      toPrimitiveText(ext.extension, "") === rawValueText
  );
  const resolved = match?.display_name ?? match?.name ?? rawValue;
  return toPrimitiveText(resolved, fallback);
};
