import { PollCard } from "@/features/polls/components/PollCard";
import { getEventPollsVM } from "@/features/polls/server/queries/get-event-polls-vm";

export async function EventPollsSection({
  eventId,
  meId,
  slug,
  canEdit,
  totalMembers,
}: {
  eventId: string;
  meId: string;
  slug: string;
  canEdit: boolean;
  totalMembers: number;
}) {
  const polls = await getEventPollsVM(eventId, meId);
  if (polls.length === 0) return null;

  return (
    <section className="space-y-4">
      {polls.map((p) => (
        <PollCard
          key={p.id}
          poll={p}
          slug={slug}
          canEdit={canEdit}
          totalMembers={totalMembers}
          meId={meId}
        />
      ))}
    </section>
  );
}
