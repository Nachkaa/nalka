const SENSITIVE_QUERY_KEYS = new Set([
  "callbackurl",
  "code",
  "csrftoken",
  "draft",
  "email",
  "from",
  "nonce",
  "redirectto",
  "state",
  "token",
]);

export function sanitizePageViewUrl(origin: string, pathname: string, search: string) {
  const params = new URLSearchParams(search);

  for (const key of [...params.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      params.delete(key);
    }
  }

  const safeSearch = params.toString();
  return `${origin}${pathname}${safeSearch ? `?${safeSearch}` : ""}`;
}
