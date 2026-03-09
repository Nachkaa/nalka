// lib/utils/display-name.ts

export function getDisplayName(
  user?: { name: string | null; email: string | null } | null,
): string {
  if (!user) return "Inconnu";
  if (user.name?.trim()) return user.name.trim().split(/\s+/)[0];
  return user.email ?? "Inconnu";
}
