import type { EventPollVM } from "../types";
import { PollCard } from "./PollCard";

export type PollsScreenProps = {
  polls: EventPollVM[];
  slug: string;
  canEdit: boolean;
  totalMembers: number;
  meId: string;
};

export function PollsScreen({ polls, slug, canEdit, totalMembers, meId }: PollsScreenProps) {
  if (polls.length === 0) {
    return (
      <div className="border-border bg-muted/40 text-muted-foreground rounded-2xl border border-dashed p-6 text-sm">
        Aucun sondage pour le moment. Activez un sondage depuis la configuration de l’événement.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          slug={slug}
          canEdit={canEdit}
          totalMembers={totalMembers}
          meId={meId}
        />
      ))}
    </div>
  );
}
