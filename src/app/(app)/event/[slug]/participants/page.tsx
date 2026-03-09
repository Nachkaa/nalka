import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { requireEventForUser } from "@/features/events/permissions";
import { prisma } from "@/lib/prisma";
import { EventRsvpStatus, EventMemberRole as ROLE } from "@prisma/client";
import { ParticipantsPageContent } from "./ParticipantsPageContent";

type Props = {
  params: { slug: string };
};

type MemberForClient = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  role: ROLE;
  rsvp: EventRsvpStatus;
  imageUrl?: string | null;
  canRemoveMember: boolean;
};

type RelativeForClient = {
  id: string;
  firstName: string;
  birthYear?: number | null;
  ownerId: string;
  ownerName: string;
  canRemoveRelative: boolean;
};

function displayName(u?: { name: string | null; email: string | null } | null) {
  if (!u) return "Inconnu";
  if (u.name && u.name.trim()) return u.name.trim();
  return u.email ?? "Inconnu";
}

export default async function ManageParticipantsPage({ params }: Props) {
  const { slug } = await params;
  if (!slug) notFound();

  const session = await auth();
  if (!session?.user) return <main className="p-6">Non autorisé</main>;

  const meId =
    session.user.id ??
    (
      await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
    )?.id;

  if (!meId) return <main className="p-6">Non autorisé</main>;

  const event = await requireEventForUser(slug, meId);
  if (!event) notFound();

  const roleByUser = new Map(event.memberships.map((m) => [m.userId, m.role]));
  const myRole = roleByUser.get(meId);
  const canManage = myRole === ROLE.OWNER || myRole === ROLE.ADMIN;

  const members: MemberForClient[] = event.memberships.map((member) => {
    const userName = displayName(member.user);
    const imageUrl =
      (member.user as { image?: string } | null | undefined)?.image ??
      (member.user as { imageUrl?: string } | null | undefined)?.imageUrl ??
      null;

    const isSelf = member.userId === meId;
    const isOwner = member.role === ROLE.OWNER;
    let canRemoveMember = false;
    if (!isSelf) {
      if (myRole === ROLE.OWNER) canRemoveMember = true;
      else if (myRole === ROLE.ADMIN && !isOwner) canRemoveMember = true;
    }

    return {
      id: member.userId ?? member.id,
      userId: member.userId,
      name: userName,
      email: member.user?.email ?? undefined,
      role: member.role,
      rsvp: member.rsvpStatus ?? EventRsvpStatus.PENDING,
      imageUrl,
      canRemoveMember,
    };
  });

  const relatives: RelativeForClient[] = (event.relatives ?? []).map((rel) => {
    const owner = rel.managedProfile?.owner ?? rel.createdBy;
    const managedByName = displayName(owner);
    const managedById = rel.managedProfile?.ownerId ?? rel.createdById;
    const isOwnerOrAdmin = myRole === ROLE.OWNER || myRole === ROLE.ADMIN;
    const canRemoveRelative = isOwnerOrAdmin || managedById === meId;

    return {
      id: rel.id,
      firstName: rel.firstName,
      birthYear: rel.birthYear,
      ownerId: managedById,
      ownerName: managedByName,
      canRemoveRelative,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:py-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="pr-3 pl-1">
          <Link href={`/event/${slug}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Revenir à l&apos;événement
          </Link>
        </Button>
      </div>

      <ParticipantsPageContent
        members={members}
        relatives={relatives}
        meId={meId}
        slug={slug}
        eventId={event.id}
        canInviteMembers={canManage}
      />
    </main>
  );
}
