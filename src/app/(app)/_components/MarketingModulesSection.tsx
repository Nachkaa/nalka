import {
  BarChart3,
  Coins,
  Gift,
  LayoutDashboard,
  ListChecks,
  Lock,
  MessageCircle,
  Sparkles,
  Utensils,
} from "lucide-react";

import { Container } from "@/components/layout/Container";

type Module = {
  name: string;
  description: string;
  status: "ALWAYS_ON" | "OPTIONAL" | "SOON";
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  note?: string;
};

const modules: Module[] = [
  {
    name: "Aperçu",
    description: "Infos de l’événement, lieu, description",
    status: "ALWAYS_ON",
    icon: LayoutDashboard,
  },
  {
    name: "Cadeaux",
    description: "Wishlist + réservations privées",
    status: "OPTIONAL",
    icon: Gift,
    note: "Réservations cachées",
  },
  {
    name: "Secret Santa",
    description: "Tirage au sort discret",
    status: "OPTIONAL",
    icon: Sparkles,
    note: "Uniquement votre assignation",
  },
  { name: "Repas partagé", description: "Qui apporte quoi", status: "OPTIONAL", icon: Utensils },
  { name: "Planning", description: "Programme & étapes", status: "OPTIONAL", icon: ListChecks },
  {
    name: "Dépenses",
    description: "Suivi + équilibrage",
    status: "OPTIONAL",
    icon: Coins,
    note: "Votre solde uniquement",
  },
  { name: "Sondages", description: "Décider ensemble", status: "SOON", icon: BarChart3 },
  { name: "Chat", description: "Discussions par événement", status: "SOON", icon: MessageCircle },
];

const statusStyles: Record<ModuleStatus, { label: string; className: string }> = {
  ALWAYS_ON: {
    label: "Toujours actif",
    className: "bg-primary/10 text-primary ring-primary/20",
  },
  OPTIONAL: {
    label: "Optionnel",
    className: "bg-muted text-muted-foreground ring-border/60",
  },
  SOON: {
    label: "Bientôt",
    className: "bg-muted/60 text-muted-foreground ring-border/60",
  },
};

type ModuleStatus = "ALWAYS_ON" | "OPTIONAL" | "SOON";

export function MarketingModulesSection() {
  return (
    <section id="modules-evenement" className="bg-background pt-10 pb-10 md:pt-14 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]" />
      <Container className="flex flex-col items-center gap-10 text-center">
        <div className="space-y-3">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Tout ce dont vous avez besoin, rien de plus.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
            Modulaire par design. Activez uniquement ce dont votre événement a besoin.
          </p>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {modules.map((module) => {
              const status = module.status as ModuleStatus;
              const isSoon = status === "SOON";
              const StatusIcon = module.icon;

              return (
                <div
                  key={module.name}
                  className={[
                    "relative flex h-full flex-col gap-3 rounded-xl border p-4 sm:p-5",
                    "transition-colors duration-200",
                    isSoon
                      ? "border-border/70 bg-muted/50 text-muted-foreground cursor-not-allowed border-dashed"
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
                        isSoon
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
                        isSoon ? "cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {statusStyles[status].label}
                    </span>
                  </div>

                  {/* title + desc */}
                  <div className="space-y-1 text-left">
                    <p
                      className={[
                        "font-semibold",
                        isSoon ? "text-muted-foreground" : "text-foreground",
                      ].join(" ")}
                    >
                      {module.name}
                    </p>
                    <p className="text-muted-foreground text-sm">{module.description}</p>
                  </div>

                  {/* optional note line like the mockup */}
                  {module.note ? (
                    <div
                      className={[
                        "mt-2 border-t pt-3 text-sm",
                        isSoon ? "border-border/40" : "border-border/60",
                      ].join(" ")}
                    >
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
            Les invités ne voient que les onglets activés.
          </p>
        </div>
      </Container>
    </section>
  );
}
