export function getDensity(bringersCount: number, totalMembers: number): number {
  if (!totalMembers) return 0;

  if (totalMembers <= 8) {
    return (bringersCount / totalMembers) * 100;
  }

  if (totalMembers <= 20) {
    return (Math.min(bringersCount, 6) / 6) * 100;
  }

  if (totalMembers <= 50) {
    return (Math.log(bringersCount + 1) / Math.log(totalMembers + 1)) * 100;
  }

  return (Math.log(bringersCount + 1) / Math.log(10)) * 100;
}

export function formatBringerName(
  user: { name?: string | null; email?: string | null } | null | undefined,
  isCurrentUser: boolean,
): string {
  if (isCurrentUser) return "Moi";

  if (!user) return "Participant";

  return user.name || user.email || "Participant";
}
