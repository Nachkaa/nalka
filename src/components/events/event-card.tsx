"use client";

import Link from "next/link";
import type { EventSummary } from "@/features/events/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Gift } from "lucide-react";

export function EventCard({ event }: { event: EventSummary }) {
  const { slug, title, date, location, invitedCount, progress, isSecretSanta } = event;
  const pct = Math.max(0, Math.min(100, Math.round(progress ?? 0)));

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="text-sm text-[var(--muted-foreground)]">
          {formatDate(date ?? "")}{location ? ` • ${location}` : ""}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className="rounded-lg inline-flex items-center gap-1">
            <Users className="h-4 w-4" aria-hidden="true" /> {invitedCount} invité{invitedCount > 1 ? "s" : ""}
          </Badge>

          {isSecretSanta ? (
            <Badge variant="outline" className="rounded-lg inline-flex items-center gap-1">
              <Gift className="h-4 w-4" aria-hidden="true" /> Secret Santa
            </Badge>
          ) : null}
        </div>

        <div>
          <Progress value={pct} aria-label="Progression des réservations" />
          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
            {pct}% des participants gâtés
          </div>
        </div>

        <div className="flex justify-end">
          <Button asChild className="rounded-xl">
            <Link href={`/event/${slug ?? ""}`}>Gérer</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "Date à définir";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
