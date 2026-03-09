// app/(app)/event/[slug]/_components/poll/pollUtils.ts
import { EventPollType } from "@prisma/client";

export function getDensity(votesCount: number, totalMembers: number) {
  if (!totalMembers) return 0;
  if (totalMembers <= 8) return (votesCount / totalMembers) * 100;
  if (totalMembers <= 20) return (Math.min(votesCount, 6) / 6) * 100;
  if (totalMembers <= 50) return (Math.log(votesCount + 1) / Math.log(totalMembers + 1)) * 100;
  return (Math.log(votesCount + 1) / Math.log(10)) * 100;
}

export function votersLabel(
  voters: { userId: string; name: string | null; email: string | null }[],
  meId?: string,
  max = 3,
) {
  if (!voters?.length) return "";
  const names = voters.map((v) => {
    const base = v.name?.trim() || v.email?.split("@")[0] || "Invité";
    return meId && v.userId === meId ? `${base} (toi)` : base;
  });
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
}

export function getDefineLabel(type: EventPollType) {
  return type === "LOCATION" ? "Définir le lieu" : "Définir la date";
}

export function getRecommendedOptionId(options: { id: string; count: number }[]) {
  if (!options.length) return null;
  let best = options[0];
  for (const o of options) if (o.count > best.count) best = o;
  return best.id;
}

export function isRecommendationStrong(options: { count: number }[], recommendedCount: number) {
  if (recommendedCount <= 0) return false;
  return options.filter((o) => o.count === recommendedCount).length === 1;
}
