"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { GiftIdeaDialog } from "./GiftIdeaDialog";

type Props = {
  eventId: string;
  slug: string;
  className?: string;
};

export function AddGiftButton({ eventId, slug, className }: Props) {
  return (
    <GiftIdeaDialog
      mode="create"
      eventId={eventId}
      slug={slug}
      trigger={
        <Button className={className ?? "mt-4 inline-flex"}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une idée
        </Button>
      }
    />
  );
}
