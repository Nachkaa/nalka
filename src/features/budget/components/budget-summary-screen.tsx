import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetTotalSetupCard } from "@/features/budget/components/budget-total-setup-card";
import { FinancialOverviewCard } from "@/features/budget/components/financial-overview-card";
import { NeedsAttentionList } from "@/features/budget/components/needs-attention-list";
import { UpcomingPaymentsList } from "@/features/budget/components/upcoming-payments-list";
import { BUDGET_METRIC_LABELS } from "@/features/budget/lib/constants";
import type { BudgetSummaryData } from "@/features/budget/lib/types";

export function BudgetSummaryScreen(props: { data: BudgetSummaryData }) {
  const { data } = props;
  const metrics = [
    data.hasDefinedTotal
      ? { label: "Budget global", value: data.totals.totalBudget }
      : {
          label: "Budget global",
          value: data.totals.totalBudget,
          displayValue: "À définir",
          helper: "Définissez un budget global pour suivre le reste à allouer.",
          tone: "muted" as const,
        },
    {
      label: "Coût estimé",
      value: data.totals.estimated,
      helper: "Coût estimé actuel sur l'ensemble des postes.",
    },
    { label: BUDGET_METRIC_LABELS.committed, value: data.totals.committed, helper: "Montants des devis engagés." },
    { label: "Réglé", value: data.totals.paid },
    data.hasDefinedTotal
      ? {
          label: "Reste à allouer",
          value: data.totals.remaining,
          helper: "Budget restant après les montants déjà retenus.",
          tone: Number(data.totals.remaining) < 0 ? ("warning" as const) : undefined,
        }
      : {
          label: "Reste à allouer",
          value: data.totals.remaining,
          displayValue: "À définir",
          helper: "Le restant sera calculé une fois le budget global défini.",
          tone: "muted" as const,
        },
  ];

  const stats = [
    { label: "Postes en consultation", value: data.counts.linesInSourcing },
    { label: "Devis en attente", value: data.counts.quotesAwaitingResponse },
    { label: "Postes au-dessus du budget prévu", value: data.counts.overTargetLines },
    { label: "Réservations non réglées", value: data.counts.unpaidBookings },
    { label: "Paiements dus cette semaine", value: data.counts.paymentsDueThisWeek },
  ];

  return (
    <div className="space-y-6 pb-10">
      {!data.hasDefinedTotal ? (
        <BudgetTotalSetupCard
          eventSlug={data.event.slug}
          title="Définir le budget global"
          intro="Définissez un budget global, puis créez vos premiers postes pour suivre les dépenses et comparer les devis."
          compact
        />
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold">Vue d&apos;ensemble du budget</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Une vue claire pour suivre le budget de votre événement.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <FinancialOverviewCard key={metric.label} metric={metric} currency={data.budget.currency} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader className="gap-1">
              <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <NeedsAttentionList items={data.needsAttention} />
        <UpcomingPaymentsList
          items={data.upcomingPayments}
          currency={data.budget.currency}
          eventSlug={data.event.slug}
        />
      </section>
    </div>
  );
}
