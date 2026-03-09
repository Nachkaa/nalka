import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EventMemberRole, EventRsvpStatus } from "@prisma/client";
import { ParticipantRow } from "./types";

type Props = {
  participant: ParticipantRow;
  canManage: boolean;
  slug: string;
};

const STATUS_LABELS: Record<EventRsvpStatus, string> = {
  GOING: "Vient",
  MAYBE: "Peut-être",
  NOT_GOING: "Ne vient pas",
  PENDING: "En attente",
};

function statusClasses(status: EventRsvpStatus) {
  if (status === EventRsvpStatus.GOING) {
    return "bg-[color:var(--success-light)] text-[color:var(--success-dark)] border-[color:var(--success-dark)]";
  }
  if (status === EventRsvpStatus.MAYBE) {
    return "bg-[color:var(--warning-light)] text-[color:var(--warning-dark)] border-[color:var(--warning-dark)]";
  }
  if (status === EventRsvpStatus.NOT_GOING) {
    return "bg-[color:var(--danger-light)] text-[color:var(--danger-dark)] border-[color:var(--danger-dark)]";
  }
  return "bg-muted text-foreground border-border";
}

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const value = `${first}${last}` || first;
  return value ? value.toUpperCase() : "?";
}

function roleLabel(role?: EventMemberRole | null) {
  if (!role) return null;
  if (role === "OWNER") return "Owner";
  if (role === "ADMIN") return "Admin";
  return null;
}

export function ParticipantsRow({ participant, canManage, slug }: Props) {
  const showEmail = canManage && !!participant.email;
  const role = roleLabel(participant.role);
  const displayName = participant.name || participant.email || "Invité";

  return (
    <div className="border-border flex items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm">
      <Avatar className="ring-background h-10 w-10 shrink-0 ring-2">
        <AvatarImage src={participant.imageUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-muted text-xs font-semibold uppercase">
          {initials(participant.name ?? participant.email)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground truncate text-sm font-semibold">{displayName}</span>
          {role && (
            <Badge
              variant="outline"
              className="border-(--primary-200) bg-(--primary-50) text-[10px] font-semibold text-(--primary-700) uppercase"
            >
              {role}
            </Badge>
          )}
        </div>
        {showEmail && (
          <p
            className="text-muted-foreground truncate text-xs"
            title={participant.email ?? undefined}
          >
            {participant.email}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
            statusClasses(participant.rsvpStatus),
          )}
        >
          {STATUS_LABELS[participant.rsvpStatus]}
        </span>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Actions participant"
                className="border-border text-muted-foreground hover:bg-muted/60 inline-flex h-8 w-8 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem asChild>
                <Link href={`/event/${slug}/participants`}>Gérer les participants</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
