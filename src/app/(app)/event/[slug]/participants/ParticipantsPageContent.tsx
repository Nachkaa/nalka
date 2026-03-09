"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EventMemberRole, EventRsvpStatus } from "@prisma/client";
import { Search, UserMinus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddParticipantLauncher } from "../_components/participants/AddParticipantLauncher";
import { removeRelative } from "../actions";
import { removeMemberAction } from "../actions/participants";

export type MemberForClient = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  role: EventMemberRole;
  rsvp: EventRsvpStatus;
  imageUrl?: string | null;
  canRemoveMember: boolean;
};

export type RelativeForClient = {
  id: string;
  firstName: string;
  birthYear?: number | null;
  ownerId: string;
  ownerName: string;
  canRemoveRelative: boolean;
};

type Props = {
  members: MemberForClient[];
  relatives: RelativeForClient[];
  meId: string;
  slug: string;
  eventId: string;
  canInviteMembers: boolean;
};

const STATUS_FILTERS: Array<{ key: EventRsvpStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "Tous" },
  { key: EventRsvpStatus.GOING, label: "Viennent" },
  { key: EventRsvpStatus.MAYBE, label: "Peut-être" },
  { key: EventRsvpStatus.PENDING, label: "En attente" },
  { key: EventRsvpStatus.NOT_GOING, label: "Ne viennent pas" },
];

const STATUS_ORDER: Record<EventRsvpStatus, number> = {
  [EventRsvpStatus.GOING]: 0,
  [EventRsvpStatus.MAYBE]: 1,
  [EventRsvpStatus.PENDING]: 2,
  [EventRsvpStatus.NOT_GOING]: 3,
};

const ROLE_ORDER: Record<EventMemberRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
};

function statusLabel(status: EventRsvpStatus) {
  switch (status) {
    case EventRsvpStatus.GOING:
      return "Vient";
    case EventRsvpStatus.MAYBE:
      return "Peut-être";
    case EventRsvpStatus.NOT_GOING:
      return "Ne vient pas";
    default:
      return "En attente";
  }
}

function statusClasses(status: EventRsvpStatus) {
  if (status === EventRsvpStatus.GOING)
    return "bg-[color:var(--success-light)] text-[color:var(--success-dark)] border-[color:var(--success-dark)]";
  if (status === EventRsvpStatus.MAYBE)
    return "bg-[color:var(--warning-light)] text-[color:var(--warning-dark)] border-[color:var(--warning-dark)]";
  if (status === EventRsvpStatus.NOT_GOING)
    return "bg-[color:var(--danger-light)] text-[color:var(--danger-dark)] border-[color:var(--danger-dark)]";
  return "bg-muted text-foreground border-border";
}

function initialsFromText(value: string) {
  const parts = value.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const safeParts = parts.slice(0, 2);
  if (safeParts.length === 0) return "?";
  return safeParts
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function ParticipantsPageContent({
  members,
  relatives,
  meId,
  slug,
  eventId,
  canInviteMembers,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventRsvpStatus | "ALL">("ALL");

  const relativesByOwnerId = useMemo(() => {
    const map = new Map<string, RelativeForClient[]>();
    for (const rel of relatives) {
      if (!map.has(rel.ownerId)) map.set(rel.ownerId, []);
      map.get(rel.ownerId)!.push(rel);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.firstName.localeCompare(b.firstName, "fr", { sensitivity: "base" }));
    }
    return map;
  }, [relatives]);

  const counts = useMemo(() => {
    return members.reduce(
      (acc, m) => {
        const status = m.rsvp ?? EventRsvpStatus.PENDING;
        const bump = (s: EventRsvpStatus) => {
          acc.total += 1;
          if (s === EventRsvpStatus.GOING) acc.going += 1;
          else if (s === EventRsvpStatus.MAYBE) acc.maybe += 1;
          else if (s === EventRsvpStatus.NOT_GOING) acc.notGoing += 1;
          else acc.pending += 1;
        };

        bump(status); // member
        const rels = relativesByOwnerId.get(m.userId) ?? [];
        for (let i = 0; i < rels.length; i += 1) bump(status);
        return acc;
      },
      { total: 0, going: 0, maybe: 0, notGoing: 0, pending: 0 },
    );
  }, [members, relativesByOwnerId]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members
      .map((m) => {
        const ownerStatus = m.rsvp ?? EventRsvpStatus.PENDING;
        const rels = relativesByOwnerId.get(m.userId) ?? [];

        const memberMatch = !term
          ? true
          : m.name.toLowerCase().includes(term) || (m.email ?? "").toLowerCase().includes(term);

        const matchingRelatives = term
          ? rels.filter((r) => r.firstName.toLowerCase().includes(term))
          : rels;

        const hasRelMatch = matchingRelatives.length > 0;
        const visible = memberMatch || hasRelMatch;

        const statusMatches = filter === "ALL" || ownerStatus === filter;
        const keep = visible && statusMatches;

        return keep
          ? {
              member: m,
              status: ownerStatus,
              relatives: matchingRelatives,
            }
          : null;
      })
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .sort((a, b) => {
        const roleDiff = ROLE_ORDER[a.member.role] - ROLE_ORDER[b.member.role];
        if (roleDiff !== 0) return roleDiff;

        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;

        const nameA = a.member.name || a.member.email || "Invité";
        const nameB = b.member.name || b.member.email || "Invité";
        return nameA.localeCompare(nameB, "fr", { sensitivity: "base" });
      });
  }, [members, relativesByOwnerId, search, filter]);

  return (
    <div className="bg-card flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border p-4 shadow-sm md:p-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl leading-tight font-semibold">Participants</h2>
          <p className="text-muted-foreground text-sm">Gérer les invités et leurs réponses</p>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou e-mail"
            className="bg-muted/50 h-11 rounded-xl pl-10 text-sm"
            aria-label="Rechercher un participant"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? counts.total
                : key === EventRsvpStatus.GOING
                  ? counts.going
                  : key === EventRsvpStatus.MAYBE
                    ? counts.maybe
                    : key === EventRsvpStatus.NOT_GOING
                      ? counts.notGoing
                      : counts.pending;

            if (key === EventRsvpStatus.PENDING && count === 0) return null;
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "border-[var(--primary-200)] bg-[var(--primary-100)] text-[var(--primary-700)]"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/40",
                )}
              >
                <span className="whitespace-nowrap">{label}</span>
                <span className="text-foreground rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold shadow-sm">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="flex h-full min-h-0 flex-col">
          <div className="space-y-3 overflow-y-auto pr-1 pb-28">
            {groups.length === 0 ? (
              <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
                Aucun participant trouvé.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.member.id} className="space-y-2">
                  <MemberRow member={group.member} slug={slug} eventId={eventId} meId={meId} />

                  {group.relatives.length > 0 && (
                    <div className="space-y-1 md:ml-10 md:border-l md:border-dashed md:border-[var(--border)] md:pl-3">
                      {group.relatives.map((rel) => (
                        <RelativeRow
                          key={rel.id}
                          relative={rel}
                          ownerStatus={group.status}
                          slug={slug}
                          eventId={eventId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="from-background via-background/95 pointer-events-none sticky bottom-0 -mx-4 bg-gradient-to-t to-transparent px-4 pt-6 pb-1 md:-mx-6 md:px-6">
          <div className="pointer-events-auto">
            {canInviteMembers ? (
              <AddParticipantLauncher eventId={eventId} slug={slug} context="participants" />
            ) : (
              <Link
                href={`/event/${slug}/participants/add-relative?from=participants`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-medium text-[var(--primary-foreground)] shadow-sm transition hover:shadow-md hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Ajouter un proche sans compte
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  slug,
  eventId,
  meId,
}: {
  member: MemberForClient;
  slug: string;
  eventId: string;
  meId: string;
}) {
  const isMe = member.userId === meId;
  const showEmail = (!member.name || member.name.trim().length === 0) && !!member.email;
  const badge =
    member.role !== "MEMBER" ? (
      <Badge
        variant="outline"
        className="border-[var(--primary-200)] bg-[var(--primary-50)] text-[10px] font-semibold text-[var(--primary-700)] uppercase"
      >
        {member.role === "OWNER" ? "HÔTE" : "Admin"}
      </Badge>
    ) : null;

  return (
    <div
      className={cn(
        "border-border flex items-start gap-3 rounded-xl border bg-white px-3 py-3 shadow-sm",
        isMe && "relative overflow-hidden bg-[var(--primary)]/[0.02]",
      )}
    >
      {isMe && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-1 rounded-l-[inherit] bg-[var(--primary)]"
        />
      )}
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]">
        {initialsFromText(member.name || member.email || "?")}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground truncate text-sm font-semibold">{member.name}</span>
          {badge}
          {isMe && <Badge variant="secondary">Vous</Badge>}
        </div>
        {showEmail && <p className="text-muted-foreground truncate text-xs">{member.email}</p>}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
            statusClasses(member.rsvp),
          )}
        >
          {statusLabel(member.rsvp)}
        </span>

        {member.canRemoveMember ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="h-8 w-8"
                aria-label={`Retirer ${member.name}`}
              >
                <UserMinus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirer {member.name} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ce participant et ses données liées seront retirés de cet événement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <form action={removeMemberAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="userIdToRemove" value={member.userId} />
                  <AlertDialogAction asChild>
                    <Button type="submit" variant="destructive">
                      Retirer
                    </Button>
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}

function RelativeRow({
  relative,
  ownerStatus,
  slug,
  eventId,
}: {
  relative: RelativeForClient;
  ownerStatus: EventRsvpStatus;
  slug: string;
  eventId: string;
}) {
  return (
    <div className="bg-muted rounded-md px-2 py-2 text-xs">
      {/* 2 colonnes dès mobile: gauche contenu, droite actions */}
      <div className="flex items-center justify-between gap-2">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[0.65rem] font-semibold text-[var(--sidebar-primary)] ring-1 ring-[var(--border)]">
            {initialsFromText(relative.firstName)}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-baseline gap-1">
              <span className="truncate font-medium">{relative.firstName}</span>
              {typeof relative.birthYear === "number" && (
                <span className="shrink-0 text-[0.7rem] text-[var(--muted-foreground)]">
                  ({relative.birthYear})
                </span>
              )}
            </div>

            <div className="truncate text-[11px] text-[var(--muted-foreground)]">
              Géré par {relative.ownerName}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Badge PROCHE: discret, à gauche du bouton */}
          <Badge
            variant="outline"
            className="shrink-0 border-[var(--primary-200)] bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-700)] uppercase"
          >
            Proche
          </Badge>

          {/* Statut: uniquement desktop */}
          <span
            className={cn(
              "hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap md:inline-flex",
              statusClasses(ownerStatus),
            )}
          >
            {statusLabel(ownerStatus)}
          </span>

          {relative.canRemoveRelative ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 md:h-8 md:w-8"
                  aria-label={`Retirer ${relative.firstName}`}
                >
                  <UserMinus className="h-5 w-5 md:h-4 md:w-4" aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirer {relative.firstName} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ce proche sera retiré de cet événement. Toutes les données associées (listes,
                    idées, réservations, etc.) seront également supprimées ou libérées. Cette action
                    est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <form action={removeRelative}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="relativeId" value={relative.id} />
                    <AlertDialogAction asChild>
                      <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                        Retirer
                      </Button>
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
    </div>
  );
}
