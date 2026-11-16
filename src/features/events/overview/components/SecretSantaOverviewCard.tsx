import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildEventModulePath } from "@/features/events/module-navigation";
import {
  buildSecretSantaOverviewCard,
  type SecretSantaOverview,
} from "@/features/secret-santa/overview";

export function SecretSantaOverviewCard({
  summary,
  eventSlug,
}: {
  summary: SecretSantaOverview;
  eventSlug: string;
}) {
  const content = buildSecretSantaOverviewCard(summary);
  const needsParticipants =
    summary.canManage && summary.state === "waiting" && summary.membersCount < 2;

  return (
    <section
      aria-labelledby="secret-santa-overview-title"
      className="border-primary/20 from-primary/10 to-card rounded-2xl border bg-linear-to-br p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="bg-primary/10 text-primary grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Secret Santa
            </p>
            <Badge variant="secondary" className="border-primary/15 bg-background/80 text-primary">
              {content.badge}
            </Badge>
          </div>
          <h2
            id="secret-santa-overview-title"
            className="text-lg font-semibold tracking-tight sm:text-xl"
          >
            {content.title}
            {summary.state === "assigned" ? (
              <span className="mt-1 block text-2xl font-bold break-words sm:text-3xl">
                {summary.recipientLabel}
              </span>
            ) : null}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {content.description}
          </p>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>
              {summary.membersCount} participant{summary.membersCount > 1 ? "s" : ""} inscrit
              {summary.membersCount > 1 ? "s" : ""}
            </span>
            {summary.budgetCapCents !== null ? (
              <span>
                Budget conseillé :{" "}
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 2,
                }).format(summary.budgetCapCents / 100)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              variant={summary.state === "assigned" ? "outline" : "default"}
              className="h-auto min-h-10 max-w-full py-2 text-center whitespace-normal"
            >
              <Link
                href={
                  needsParticipants
                    ? `/event/${eventSlug}/participants`
                    : buildEventModulePath(eventSlug, "secret-santa")
                }
              >
                {content.action}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </Button>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Les attributions restent privées.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
