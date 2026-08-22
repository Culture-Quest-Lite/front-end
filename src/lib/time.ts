export function formatTimeDisplayValue(value?: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return "";
  }

  const plainTimeMatch = normalizedValue.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (plainTimeMatch) {
    return `${plainTimeMatch[1]}:${plainTimeMatch[2]}`;
  }

  const isoTimeMatch = normalizedValue.match(
    /T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/,
  );

  if (isoTimeMatch) {
    return `${isoTimeMatch[1]}:${isoTimeMatch[2]}`;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue;
  }

  return parsedDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatTimeRangeDisplayValue(
  startTime?: string | null,
  endTime?: string | null,
) {
  const startLabel = formatTimeDisplayValue(startTime);
  const endLabel = formatTimeDisplayValue(endTime);

  if (!startLabel || !endLabel) {
    return "";
  }

  return `${startLabel} - ${endLabel}`;
}
