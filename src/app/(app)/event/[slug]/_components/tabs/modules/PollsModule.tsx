import type { EventPollVM } from "@/domain/polls/getEventPollsVM";
import { PollCard } from "../../../_components/poll/PollCard";

export type PollsModuleProps = {
  polls: EventPollVM[];
  slug: string;
  canEdit: boolean;
  totalMembers: number;
  meId: string;
};

export function PollsModule({ polls, slug, canEdit, totalMembers, meId }: PollsModuleProps) {
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
