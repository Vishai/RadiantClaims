const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function toISODateString(
  value: string | Date | null | undefined
): string {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().split("T")[0] || "";
  }

  const [datePart] = value.split("T");
  if (datePart && ISO_DATE_REGEX.test(datePart)) {
    return datePart;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0] || "";
  }

  return "";
}

export function parseISODateToUTC(value: string): Date {
  const normalized = toISODateString(value);
  const parts = normalized.split("-").map(Number);
  const [year, month, day] = parts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    parts.some((part) => Number.isNaN(part))
  ) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatISODateForDisplay(
  value: string | Date | null | undefined
): string {
  const normalized = toISODateString(value);
  if (!normalized) return "N/A";

  const parts = normalized.split("-").map(Number);
  const [year, month, day] = parts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    parts.some((part) => Number.isNaN(part))
  ) {
    return "N/A";
  }
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
