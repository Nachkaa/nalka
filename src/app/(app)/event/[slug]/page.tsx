import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ReservationStatus as RS,
  EventMemberRole as ER,
  EventGiftMode as EGM,
} from "@prisma/client";
import { notFound } from "next/navigation";
import LeaveEventDialog from "./LeaveEventDialog";
import { requireEventForUser } from "@/features/events/permissions";
import { EventBringSection } from "./_components/EventBringSection";
import { EventAvailableModules } from "./_components/EventAvailableModules";
import { EventHeader } from "./_components/EventHeader";
import { EventMyListSection } from "./_components/EventMyListSection";
import { EventParticipantsSection } from "./_components/EventParticipantsSection";
import { EventOtherListsSection } from "./_components/EventOtherListsSection";
import { SecretSantaSection } from "./_components/SecretSantaSection";
import { ReservationStatus } from "@prisma/client";
import type { GiftListWithParticipantAndItems } from "./_components/EventOtherListsSection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


type PageProps = { params: Promise<{ slug?: string }> };
const STATUS = RS;
const ROLE = ER;
const MODE = EGM;

export default async function EventPage({ params }: PageProps) {
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

  const isAdmin = event.memberships.some(
    (m) => m.userId === meId && (m.role === ROLE.ADMIN || m.role === ROLE.OWNER),
  );

  const roleByUser = new Map(event.memberships.map(m => [m.userId, m.role]));

  const myRole = roleByUser.get(meId);
  const canRemoveByUserId = new Map<string, boolean>();

  for (const m of event.memberships) {
    const targetRole = m.role;
    const targetId = m.userId;

    let allowed = false;
    if (myRole === "OWNER") allowed = targetId !== meId;
    else if (myRole === "ADMIN") allowed = targetRole === "MEMBER";

    canRemoveByUserId.set(targetId, allowed);
  }

  const canRemoveRecord: Record<string, boolean> =
    Object.fromEntries(canRemoveByUserId);

  const isOwnerRole = myRole === "OWNER";
  const isAdminRole = myRole === "ADMIN";

  const canRemoveRelativeById = new Map<string, boolean>();

  for (const rel of event.relatives ?? []) {
    let allowed = false;

    if (isOwnerRole || isAdminRole) {
      // OWNER / ADMIN peuvent retirer n'importe quel proche de l'événement
      allowed = true;
    } else {
      // MEMBER : uniquement les proches qu'il a créés
      allowed = rel.createdById === meId;
    }

    canRemoveRelativeById.set(rel.id, allowed);
  }

  const canRemoveRelativeRecord: Record<string, boolean> =
    Object.fromEntries(canRemoveRelativeById);


  const rawLists = event.lists as GiftListWithParticipantAndItems[];

  const ownerMembership = event.memberships.find((m) => m.role === ROLE.OWNER);
  const ownerUserId = ownerMembership?.userId ?? null;

  let myList: GiftListWithParticipantAndItems | null = null;
  let otherLists: GiftListWithParticipantAndItems[] = [];

  if (event.hasGifts) {
    if (event.giftMode === MODE.HOST_LIST && ownerUserId) {
      // Mode "Host list" :
      // - l'hôte voit uniquement SA liste
      // - les invités voient uniquement la liste de l'hôte (pas leurs anciennes listes)
      const hostList =
        rawLists.find(
          (l) => l.ownerId === ownerUserId && l.eventRelativeId === null,
        ) ?? null;

      if (meId === ownerUserId) {
        // hôte : "Ma liste" = liste de l'hôte, aucune autre liste affichée
        myList = hostList;
        otherLists = [];
      } else {
        // invité : pas de "Ma liste" perso, on ne garde que la liste de l'hôte
        myList = null;
        otherLists = hostList ? [hostList] : [];
      }
    } else {
      // PERSONAL_LISTS / SECRET_SANTA : comportement standard
      myList =
        rawLists.find(
          (l) => l.ownerId === meId && l.eventRelativeId === null,
        ) ?? null;

      // Tout le reste (autres users + tous les proches)
      otherLists = rawLists.filter(
        (l) => !(l.ownerId === meId && l.eventRelativeId === null),
      );
    }
  }

  const showBudget =
    event.hasGifts &&
    event.giftMode !== MODE.HOST_LIST &&
    typeof event.budgetCapCents === "number";

  const bringItems = await prisma.eventBringItem.findMany({
    where: { eventId: event.id },
    include: {
      bringers: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const members = event.memberships.map((m) => ({
    id: m.userId,
    name: m.user?.name ?? null,
    email: m.user?.email ?? null,
  }));

  const canContributeToBring = event.memberships.some((m) => m.userId === meId);

  const reservedCountByUserId: Record<string, number> = {};

  for (const list of otherLists) {
    const count = list.items.filter((i) =>
      i.reservations.some(
        (r) =>
          r.byUserId === meId &&
          r.status === ReservationStatus.RESERVED,
      ),
    ).length;

    // On ne compte que pour des listes de users,
    // les proches (ownerId null) ne sont pas dans canRemoveByUserId de toute façon
    if (count > 0 && list.ownerId) {
      reservedCountByUserId[list.ownerId] = count;
    }
  }

  return (
    <main className="space-y-8 p-0">
      {/* Barre de retour uniquement */}
      <EventHeader
        event={event}
        slug={slug}
        isAdmin={isAdmin}
        showBudget={showBudget}
      />

      {event.giftMode === MODE.SECRET_SANTA && (
        <SecretSantaSection
          eventId={event.id}
          slug={slug}
          isAdmin={isAdmin}
          membersCount={event.memberships.length}
          budgetCapCents={event.budgetCapCents}
          isSecondHandOk={event.isSecondHandOk}
          isHandmadeOk={event.isHandmadeOk}
        />
      )}

      <EventAvailableModules
        eventId={event.id}
        slug={event.slug}
        hasBringSection={event.hasBringSection}
        isAdmin={isAdmin}
      />

      {event.hasBringSection && (
        <EventBringSection
          eventId={event.id}
          slug={event.slug}
          items={bringItems}
          currentUserId={meId}
          canContribute={canContributeToBring}
          totalMembers={event.memberships.length}
          isAdmin={isAdmin}
          members={members}
        />
      )}

      {/* Ma liste */}
      {event.hasGifts && myList && (
        <EventMyListSection
          eventId={event.id}
          slug={slug}
          isNoSpoil={event.isNoSpoil}
          myList={myList}
        />
      )}

      {/* Participants (toujours) */}
      <EventParticipantsSection
        eventId={event.id}
        slug={event.slug}
        meId={meId}
        memberships={event.memberships}
        canRemoveByUserId={canRemoveRecord}
        reservedCountByUserId={reservedCountByUserId}
        relatives={event.relatives}                    // NEW
        canRemoveRelativeById={canRemoveRelativeRecord} // NEW
      />
      {/* Listes des autres participants (uniquement en mode listes perso) */}
      {event.hasGifts && otherLists.length > 0 && (
        <EventOtherListsSection
          eventId={event.id}
          slug={slug}
          meId={meId}
          otherLists={otherLists}
          isAdmin={isAdmin}
          isAnonReservations={event.isAnonReservations}
        />
      )}
      {/* Danger zone: quitter l’événement */}
      {!isAdmin && (
        <section
          aria-labelledby="leave-event-heading"
          className="mt-12 border-t pt-8"
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <h2
              id="leave-event-heading"
              className="text-sm font-semibold text-foreground"
            >
              Ne plus participer à cet événement
            </h2>
            <p>
              Vous pourrez toujours être réinvité plus tard par l’organisateur.
            </p>
            <LeaveEventDialog eventId={event.id} />
          </div>
        </section>
      )}
    </main>
  );
}
