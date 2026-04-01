import "server-only";

function normalizeHubSpotAccessToken(raw: string): string {
  let s = raw.trim();
  if (s.codePointAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  const firstLine = (s.split(/\r?\n/)[0] ?? "").trim();
  s = firstLine;
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(s)) {
    s = s.replace(/^bearer\s+/i, "").trim();
  }
  return s;
}

export function getHubSpotAccessToken(): string | undefined {
  const raw = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!raw) return undefined;
  const normalized = normalizeHubSpotAccessToken(raw);
  return normalized.length > 0 ? normalized : undefined;
}

export function isHubSpotAccessTokenConfigured(): boolean {
  return Boolean(getHubSpotAccessToken());
}
