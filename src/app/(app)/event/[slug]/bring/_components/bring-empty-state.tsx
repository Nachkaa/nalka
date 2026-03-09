// app/(app)/event/[slug]/bring/_components/bring-empty-state.tsx

"use client";

import { Package } from "lucide-react";

export function BringEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-muted mb-4 rounded-full p-4">
        <Package className="text-muted-foreground h-8 w-8" />
      </div>
      <p className="text-muted-foreground text-sm">
        Aucun élément pour le moment.
        <br />
        Ajoutez-en un pour commencer !
      </p>
    </div>
  );
}
