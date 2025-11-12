"use client";

import { UserPlus } from "lucide-react";
import { InviteMemberDialog } from "./AddEventMembers";

export default function InviteMemberChip({ eventId }: { eventId: string }) {
  return (
    <div className="flex w-16 flex-col items-center">
      <InviteMemberDialog eventId={eventId} asChild>
        <button
          type="button"
          aria-label="Ajouter un participant"
          title="Ajouter un participant"
          // évite l’avertissement si Radix modifie des attrs à l’hydratation
          suppressHydrationWarning
          // classe figée pour SSR = Client
          className="relative inline-flex h-12 w-12 select-none items-center justify-center rounded-full
                     bg-[var(--primary)] text-[var(--primary-foreground)]
                     ring-2 ring-[color-mix(in_oklch,var(--primary),black_20%)]
                     transition-transform hover:scale-[1.03] focus:outline-none
                     focus:ring-2 focus:ring-[var(--primary)] ring-offset-2
                     focus:ring-offset-[var(--background)]"
        >
          <UserPlus className="h-6 w-6" aria-hidden="true" />
        </button>
      </InviteMemberDialog>
      <span className="mt-1 w-full truncate text-center text-xs text-[var(--muted-foreground)]">
        Ajouter
      </span>
    </div>
  );
}
