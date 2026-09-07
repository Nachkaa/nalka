export const AUTH_ENTRY_PATH = "/login" as const;

export function getAuthEntryUrl(from?: string) {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return AUTH_ENTRY_PATH;
  }

  return `${AUTH_ENTRY_PATH}?from=${encodeURIComponent(from)}`;
}
