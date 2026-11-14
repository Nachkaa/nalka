import { prisma } from "@/lib/prisma";

export async function getInviteEmailDomainPreview(code: string) {
  const invite = await prisma.inviteToken.findUnique({
    where: { code },
    select: {
      expiresAt: true,
      remainingUses: true,
      event: { select: { allowedEmailDomains: true } },
    },
  });

  if (
    !invite ||
    invite.remainingUses <= 0 ||
    (invite.expiresAt && invite.expiresAt <= new Date())
  ) {
    return null;
  }

  return { allowedEmailDomains: invite.event.allowedEmailDomains };
}
