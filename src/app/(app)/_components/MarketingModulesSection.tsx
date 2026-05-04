import {
  BarChart3,
  CalendarClock,
  Gift,
  LayoutDashboard,
  ListChecks,
  Lock,
  ReceiptEuro,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";

import { Container } from "@/components/layout/Container";

type Module = {
  name: string;
  description: string;
  status: "ALWAYS_ON" | "OPTIONAL" | "CONTEXTUAL";
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  note?: string;
};

const modules: Module[] = [
  {
    name: "Aperçu",
    description: "Brief, lieu, date, prochaines actions",
    status: "ALWAYS_ON",
    icon: LayoutDashboard,
  },
  {
    name: "Participants & RSVP",
    description: "Suivi des invités, réponses et capacité",
    status: "ALWAYS_ON",
    icon: Users,
  },
  {
    name: "Programme",
    description: "Déroulé, horaires, lieux et temps forts",
    status: "OPTIONAL",
    icon: CalendarClock,
  },
  {
    name: "Décisions",
    description: "Sondages de date, lieu et arbitrages",
    status: "OPTIONAL",
    icon: BarChart3,
  },
  {
    name: "Budget",
    description: "Postes, devis, engagement et reste à allouer",
    status: "OPTIONAL",
    icon: ReceiptEuro,
  },
  {
    name: "Prestataires",
    description: "Devis, sélection et échéances de paiement",
    status: "OPTIONAL",
    icon: ListChecks,
  },
  {
    name: "Contributions",
    description: "Matériel, boissons ou apports d'équipe",
    status: "CONTEXTUAL",
    icon: Utensils,
  },
  {
    name: "Cadeaux & rituels",
    description: "Listes, Secret Santa et usages internes",
    status: "CONTEXTUAL",
    icon: Gift,
    note: "Confidentialite conservee",
  },
  {
    name: "Secret Santa",
    description: "Tirage privé pour les contextes d'équipe",
    status: "CONTEXTUAL",
    icon: Sparkles,
    note: "Attributions privées",
  },
];

type ModuleStatus = Module["status"];

const statusStyles: Record<ModuleStatus, { label: string; className: string }> = {
  ALWAYS_ON: {
    label: "Socle",
    className: "bg-primary/10 text-primary ring-primary/20",
  },
  OPTIONAL: {
    label: "Pilotage",
    className: "bg-muted text-muted-foreground ring-border/60",
  },
  CONTEXTUAL: {
    label: "Contextuel",
    className: "bg-muted/60 text-muted-foreground ring-border/60",
  },
};

export function MarketingModulesSection() {
  return (
    <section id="modules-evenement" className="bg-background pt-10 pb-10 md:pt-14 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
      <Container className="flex flex-col items-center gap-10 text-center">
        <div className="space-y-3">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Un espace opérationnel par événement.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
            Activez les modules utiles pour suivre les participants, le programme, les décisions,
            les devis et le budget sans alourdir le pilotage.
          </p>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {modules.map((module) => {
              const status = module.status;
              const isContextual = status === "CONTEXTUAL";
              const StatusIcon = module.icon;

              return (
                <div
                  key={module.name}
                  className={[
                    "relative flex h-full flex-col gap-3 rounded-xl border p-4 sm:p-5",
                    "transition-colors duration-200",
                    isContextual
                      ? "border-border/70 bg-muted/50 text-muted-foreground"
                      : [
                          "border-border/70 from-card to-card/70 text-foreground bg-linear-to-b",
                          "hover:border-primary/40",
                          "hover:shadow-[0_14px_34px_-18px_rgba(0,0,0,0.45)]",
                        ].join(" "),
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                        "transition-shadow duration-200",
                        isContextual
                          ? "bg-muted text-muted-foreground ring-border/60"
                          : [
                              "bg-linear-to-br from-(--primary-600) to-(--primary-500)",
                              "ring-primary/30 text-white",
                              "shadow-[0_10px_18px_-12px_rgba(0,0,0,0.45)]",
                            ].join(" "),
                      ].join(" ")}
                    >
                      <StatusIcon className="h-6 w-6 shrink-0" aria-hidden />
                    </span>

                    <span
                      className={[
                        "inline-flex items-center rounded-xl px-3 py-1 text-[11px] font-semibold shadow-sm ring-1",
                        statusStyles[status].className,
                      ].join(" ")}
                    >
                      {statusStyles[status].label}
                    </span>
                  </div>

                  <div className="space-y-1 text-left">
                    <p
                      className={[
                        "font-semibold",
                        isContextual ? "text-muted-foreground" : "text-foreground",
                      ].join(" ")}
                    >
                      {module.name}
                    </p>
                    <p className="text-muted-foreground text-sm">{module.description}</p>
                  </div>

                  {module.note ? (
                    <div className="mt-2 border-t border-border/60 pt-3 text-sm">
                      <div className="text-primary/90 flex items-center gap-2">
                        <Lock className="h-4 w-4" aria-hidden />
                        <span className="text-xs font-medium">{module.note}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-5 text-sm">
            Les participants ne voient que les modules activés pour leur événement.
          </p>
        </div>
      </Container>
    </section>
  );
}
