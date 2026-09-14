export function normalizeWebsiteInput(value) {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return '';
  }

  // Preserve explicit schemes so the backend can reject unsafe/non-HTTP URLs.
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}
