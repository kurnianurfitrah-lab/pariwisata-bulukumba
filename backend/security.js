const GOOGLE_MAP_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'google.co.id',
  'www.google.co.id',
  'maps.google.co.id',
]);

function extractIframeSource(value) {
  const match = value.match(/<iframe\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)')[^>]*>/i);
  return match?.[1] || match?.[2] || null;
}

export function normalizeMapEmbedUrl(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const rawValue = String(value).trim();
  const candidate = rawValue.startsWith('<')
    ? extractIframeSource(rawValue)
    : rawValue;

  if (!candidate) {
    throw new Error('Peta harus berupa URL embed Google Maps yang valid');
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('URL embed Google Maps tidak valid');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('URL peta harus menggunakan HTTPS');
  }

  if (!GOOGLE_MAP_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error('Peta hanya boleh menggunakan domain Google Maps');
  }

  if (!parsed.pathname.startsWith('/maps')) {
    throw new Error('Gunakan URL embed dari Google Maps');
  }

  return parsed.toString();
}

export function normalizeOptionalHttpUrl(value, label = 'URL') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  let parsed;
  try {
    parsed = new URL(String(value).trim());
  } catch {
    throw new Error(`${label} tidak valid`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} harus menggunakan HTTP atau HTTPS`);
  }

  return parsed.toString();
}

export function normalizeImageReference(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const candidate = String(value).trim();
  if (candidate.startsWith('/uploads/') || !candidate.includes('/')) {
    const filename = candidate.startsWith('/uploads/')
      ? candidate.slice('/uploads/'.length)
      : candidate;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(filename)) {
      throw new Error('Path gambar lokal tidak valid');
    }
    return `/uploads/${filename}`;
  }

  return normalizeOptionalHttpUrl(candidate, 'URL gambar');
}

export function getSessionCookieOptions(env) {
  return {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}
