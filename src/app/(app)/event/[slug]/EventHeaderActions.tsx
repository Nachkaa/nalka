"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteShareDialog } from "./InviteShareDialog";

type EventHeaderActionsProps = {
  slug: string;
  isAdmin: boolean;
};

export function EventHeaderActions({ slug, isAdmin }: EventHeaderActionsProps) {
  if (!isAdmin) return null;

  return (
    // Actions row on mobile, right side on desktop
    <div className="flex flex-wrap gap-2 md:items-center">
      {/* compact buttons on mobile */}
      <div className="contents [&>button]:h-8 [&>button]:px-2 [&>button]:text-xs md:[&>button]:h-9 md:[&>button]:px-3 md:[&>button]:text-sm">
        <InviteShareDialog eventRef={slug} />

        <Button
          asChild
          variant="secondary"
          size="sm"
          className="rounded-full px-3"
          aria-label="Modifier l’événement"
        >
          <Link href={`/event/${slug}/edit`} prefetch={false}>
            <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Modifier
          </Link>
        </Button>
      </div>
    </div>
  );
}
