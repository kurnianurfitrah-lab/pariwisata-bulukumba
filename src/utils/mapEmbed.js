const ALLOWED_GOOGLE_MAP_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'google.co.id',
  'www.google.co.id',
  'maps.google.co.id',
]);

function extractLegacyIframeSource(value) {
  const match = value.match(/<iframe\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)')[^>]*>/i);
  return match?.[1] || match?.[2] || null;
}

export function getSafeMapEmbedUrl(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmedValue = value.trim();
  const candidate = trimmedValue.startsWith('<')
    ? extractLegacyIframeSource(trimmedValue)
    : trimmedValue;

  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:') return null;
    if (!ALLOWED_GOOGLE_MAP_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (!url.pathname.startsWith('/maps')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

