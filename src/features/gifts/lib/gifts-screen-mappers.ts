export function getGiftParticipantDisplayName(user?: { name: string | null; email: string | null } | null) {
  if (!user) return "Quelqu'un";
  if (user.name && user.name.trim()) return user.name.trim().split(/\s+/)[0];
  return user.email ?? "Quelqu'un";
}
