import Link from "next/link";

import { Button } from "@/components/ui/button";
import { QuotesLineList } from "@/features/budget/components/quotes-line-list";
import type { BudgetQuotesOverviewData } from "@/features/budget/lib/types";

export function BudgetQuotesScreen(props: { data: BudgetQuotesOverviewData }) {
  const hasPostes = props.data.lines.length > 0;
  const hasQuotes = props.data.totalQuotesCount > 0;
  const firstQuotesHref =
    props.data.lines.length === 1
      ? `/event/${props.data.event.slug}/budget/quotes/${props.data.lines[0].id}`
      : `/event/${props.data.event.slug}/budget/quotes#postes-a-quotter`;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-semibold">Devis</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Chaque devis est rattache a un poste budgetaire.
        </p>
      </div>

      {!hasPostes ? (
        <div className="space-y-4 rounded-xl border border-dashed p-8">
          <p className="text-muted-foreground text-sm">
            Ajoute d&apos;abord un poste budgetaire pour gerer des devis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/event/${props.data.event.slug}/budget/lines`}>Voir les postes</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!hasQuotes ? (
            <div className="space-y-4 rounded-xl border border-dashed p-8">
              <p className="text-muted-foreground text-sm">Aucun devis pour le moment.</p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" asChild>
                  <Link href={firstQuotesHref}>Ajouter un premier devis</Link>
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/event/${props.data.event.slug}/budget/lines`}>Voir les postes</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div id="postes-a-quotter">
            <QuotesLineList
              lines={props.data.lines}
              vendors={props.data.vendors}
              currency={props.data.budget.currency}
              eventSlug={props.data.event.slug}
            />
          </div>
        </div>
      )}
    </div>
  );
}
