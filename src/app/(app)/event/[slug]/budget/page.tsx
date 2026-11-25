import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSharedBudget, SharedBudgetError } from "@/features/budget/shared/server/ledger";
import { SharedBudgetScreen } from "@/features/budget/shared/components/shared-budget-screen";

export default async function SharedBudgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?from=${encodeURIComponent(`/event/${slug}/budget`)}`);
  try {
    const data = await getSharedBudget(slug, user.userId);
    return <SharedBudgetScreen initial={data} />;
  } catch (error) {
    if (error instanceof SharedBudgetError && error.status === 404) notFound();
    throw error;
  }
}
