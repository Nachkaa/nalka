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

const CAPTURED_URL_PROPERTY_KEYS = [
  "$current_url",
  "$initial_current_url",
  "$session_entry_url",
  "$referrer",
  "$initial_referrer",
  "$external_click_url",
] as const;

const FALLBACK_ORIGIN = "https://nalka.invalid";

function sanitizeSearchParams(search: string) {
  const params = new URLSearchParams(search);

  for (const key of [...params.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      params.delete(key);
    }
  }

  return params.toString();
}

export function sanitizePageViewUrl(origin: string, pathname: string, search: string) {
  const safeSearch = sanitizeSearchParams(search);
  return `${origin}${pathname}${safeSearch ? `?${safeSearch}` : ""}`;
}

export function sanitizeCapturedUrl(value: string) {
  try {
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(value);
    const url = new URL(value, FALLBACK_ORIGIN);
    const sanitized = sanitizePageViewUrl(url.origin, url.pathname, url.search);

    return isAbsolute ? sanitized : sanitized.slice(FALLBACK_ORIGIN.length);
  } catch {
    return value;
  }
}

export function sanitizePostHogProperties<T extends Record<string, unknown>>(properties: T): T {
  const sanitized: Record<string, unknown> = { ...properties };

  for (const key of CAPTURED_URL_PROPERTY_KEYS) {
    const value = sanitized[key];
    if (typeof value === "string") {
      sanitized[key] = sanitizeCapturedUrl(value);
    }
  }

  for (const nestedKey of ["$set", "$set_once"] as const) {
    const nested = sanitized[nestedKey];
    if (!nested || Array.isArray(nested) || typeof nested !== "object") continue;

    sanitized[nestedKey] = sanitizePostHogProperties(nested as Record<string, unknown>);
  }

  const elements = sanitized.$elements;
  if (Array.isArray(elements)) {
    sanitized.$elements = elements.map((element) => {
      if (!element || Array.isArray(element) || typeof element !== "object") return element;

      const next = { ...(element as Record<string, unknown>) };
      if (typeof next.attr__href === "string") {
        next.attr__href = sanitizeCapturedUrl(next.attr__href);
      }
      return next;
    });
  }

  return sanitized as T;
}
