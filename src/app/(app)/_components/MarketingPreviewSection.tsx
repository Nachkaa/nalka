import { Activity, Calendar, Lock, Map } from "lucide-react";

import { Container } from "@/components/layout/Container";

const previewTabs = [
  { label: "Aperçu", private: false, active: true },
  { label: "Participants", private: false, active: false },
  { label: "Programme", private: false, active: false },
  { label: "Décisions", private: false, active: false },
  { label: "Budget", private: true, active: false },
  { label: "Devis", private: true, active: false },
] as const;

const eventInfo = [
  { icon: Calendar, label: "Jeudi 18 juin 2026 à 09h30" },
  { icon: Map, label: "Lieu : Centre de conférence Lyon" },
] as const;

const guarantees = [
  {
    title: "Budget réservé aux organisateurs",
    description: "Les participants ne voient pas les montants, devis ou notes internes.",
  },
  {
    title: "Accès limité par module",
    description: "Chaque personne consulte uniquement les informations utiles à son rôle.",
  },
] as const;

function ActiveBadge() {
  return (
    <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
      <Activity className="h-3.5 w-3.5" aria-hidden />
      Actif
    </span>
  );
}

export function MarketingPreviewSection() {
  return (
    <section id="espace-prive" className="bg-background py-20 md:py-28">
      <Container className="flex flex-col items-center gap-10 text-center">
        <div className="space-y-3">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-5xl">
            Un hub clair pour piloter l&apos;événement.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
            Simple pour les organisateurs, lisible pour les participants, strict sur les données
            sensibles.
          </p>
        </div>

        <div className="w-full max-w-5xl">
          <div className="bg-card overflow-hidden rounded-3xl border text-left shadow-lg">
            <div className="border-b px-6 py-7 sm:px-10">
              <h3 className="text-foreground text-xl font-semibold sm:text-2xl">
                Séminaire client Q3
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Piloté par l&apos;équipe opérations - Jeu. 18 juin 2026
              </p>
            </div>

            <div className="border-b bg-neutral-50 px-6 sm:px-10">
              <div
                role="tablist"
                aria-label="Apercu des fonctionnalites"
                className="flex flex-wrap items-center gap-x-6 gap-y-2"
              >
                {previewTabs.map((tab) => (
                  <div
                    key={tab.label}
                    role="tab"
                    aria-selected={tab.active ?? false}
                    className={[
                      "relative inline-flex items-center gap-2 pt-4 pb-4 text-sm",
                      tab.active
                        ? "text-foreground after:bg-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:rounded-full"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    <span>{tab.label}</span>
                    {tab.private ? <ActiveBadge /> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 px-6 py-8 sm:px-10">
              <p className="text-foreground text-sm font-semibold">Informations</p>
              <div className="mt-4 space-y-3">
                {eventInfo.map((item) => (
                  <div
                    key={item.label}
                    className="border-border/60 bg-muted/25 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center">
                      <item.icon className="text-primary h-4.5 w-4.5" aria-hidden />
                    </span>
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {guarantees.map((g) => (
                  <div
                    key={g.title}
                    className="border-primary/10 bg-primary/10 flex items-start gap-4 rounded-xl border px-5 py-4"
                  >
                    <span className="bg-background ring-primary/15 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1">
                      <Lock className="text-primary h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="space-y-1">
                      <p className="text-foreground font-semibold">{g.title}</p>
                      <p className="text-muted-foreground text-sm">{g.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
