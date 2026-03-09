// app/(app)/event/[slug]/_components/tabs/modules/secret-santa/SecretSantaSection.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtEUR } from "@/lib/formatters";
import { emitGlobalRefresh } from "@/lib/refresh";
import { motion } from "framer-motion";
import { Hammer, Loader2, Recycle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { launchDraw, setSecretSantaBudget } from "../../../../actions/secret-santa";

type TargetItem = {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
};

type MeTarget = {
  receiver: { id: string; name: string | null; email: string | null };
  listId: string | null;
  receiverItems: TargetItem[];
} | null;

type SecretSantaSectionProps = {
  eventId: string;
  slug: string;
  isAdmin: boolean;
  membersCount: number;
  budgetCapCents: number | null;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
};

function DrawButton({ disabledBase, hasDraw }: { disabledBase: boolean; hasDraw: boolean }) {
  const { pending } = useFormStatus();

  const label = pending
    ? "Tirage en cours..."
    : hasDraw
      ? "Relancer le tirage"
      : "Lancer le tirage";

  const title = disabledBase
    ? "Au moins 2 participants requis"
    : hasDraw
      ? "Relancer le tirage"
      : "Lancer le tirage";

  return (
    <Button
      type="submit"
      disabled={disabledBase || pending}
      aria-disabled={pending || disabledBase}
      title={title}
      className="inline-flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span>{label}</span>
    </Button>
  );
}

function displayName(u?: { name: string | null; email: string | null } | null) {
  if (!u) return "Inconnu";
  if (u.name && u.name.trim()) return u.name.trim();
  return u.email ?? "Inconnu";
}

async function fetchMyTarget(eventId: string): Promise<MeTarget> {
  try {
    const response = await fetch(`/api/secret-santa/${eventId}/me`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as MeTarget;
  } catch {
    return null;
  }
}

export function SecretSantaSection({
  eventId,
  slug,
  isAdmin,
  membersCount,
  budgetCapCents,
  isSecondHandOk,
  isHandmadeOk,
}: SecretSantaSectionProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isBudgetSaving, startBudgetTransition] = useTransition();
  const [target, setTarget] = useState<MeTarget>(null);
  const [hasDraw, setHasDraw] = useState<boolean>(false);

  const [budgetCents, setBudgetCents] = useState<number | null>(() => budgetCapCents);
  const [isBudgetEditing, setIsBudgetEditing] = useState(false);
  const [showCustomBudget, setShowCustomBudget] = useState(false);
  const [customBudgetEuro, setCustomBudgetEuro] = useState(
    typeof budgetCapCents === "number" ? String(Math.round(budgetCapCents / 100)) : "",
  );
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const chipValues = [10, 20, 30, 50, 100] as const;

  useEffect(() => {
    let alive = true;
    fetchMyTarget(eventId)
      .then((data) => {
        if (alive && data?.receiver) {
          setTarget(data);
          setHasDraw(true);
        }
      })
      .catch(() => {
        // No-op
      });

    return () => {
      alive = false;
    };
  }, [eventId]);

  const openBudgetEditor = () => {
    const currentEuro = typeof budgetCents === "number" ? Math.round(budgetCents / 100) : null;
    const isChipValue =
      currentEuro !== null && chipValues.includes(currentEuro as (typeof chipValues)[number]);

    setCustomBudgetEuro(currentEuro !== null ? String(currentEuro) : "");
    setShowCustomBudget(!isChipValue);
    setBudgetError(null);
    setIsBudgetEditing(true);
  };

  const cancelBudgetEdit = () => {
    setIsBudgetEditing(false);
    setShowCustomBudget(false);
    setBudgetError(null);
    setCustomBudgetEuro(
      typeof budgetCents === "number" ? String(Math.round(budgetCents / 100)) : "",
    );
  };

  const saveBudget = (budgetEuro: string, options?: { closeAfterSave?: boolean }) => {
    if (!isAdmin) return;

    const trimmed = budgetEuro.trim();
    if (trimmed && !/^\d+$/.test(trimmed)) {
      setBudgetError("Le budget doit être un nombre entier (euros).");
      return;
    }

    setBudgetError(null);

    startBudgetTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("eventId", eventId);
        formData.set("slug", slug);
        formData.set("budgetEuro", trimmed);

        const result = await setSecretSantaBudget(formData);
        setBudgetCents(result.budgetCapCents);
        setCustomBudgetEuro(
          typeof result.budgetCapCents === "number"
            ? String(Math.round(result.budgetCapCents / 100))
            : "",
        );

        if (options?.closeAfterSave) {
          setIsBudgetEditing(false);
          setShowCustomBudget(false);
        }

        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossible d'enregistrer le budget.";
        setBudgetError(message);
      }
    });
  };

  return (
    <div className="space-y-8">
      {target && (
        <motion.section
          aria-labelledby="my-target"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl bg-[color-mix(in_oklch,white_88%,var(--primary))] p-6 shadow-sm ring-1 ring-(--primary)/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_60%)] opacity-70"
          />

          <div className="relative flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-(--primary) text-(--primary-foreground) shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 id="my-target" className="text-sm font-medium text-(--muted-foreground)">
                Tu offres un cadeau a
              </h2>
              <p className="text-2xl leading-tight font-bold tracking-tight">
                {displayName(target.receiver)}
              </p>
              {typeof budgetCents === "number" && (
                <p className="mt-1 text-sm text-(--muted-foreground)">
                  Budget conseillé : {fmtEUR(budgetCents)}
                </p>
              )}
            </div>
          </div>

          {target.listId && target.receiverItems.length > 0 ? (
            <div className="relative mt-4">
              <h3 className="mb-2 text-sm font-medium text-(--muted-foreground)">Ses idées</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {target.receiverItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-black/5 bg-white/90 px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{item.title}</span>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded text-xs underline hover:no-underline focus:ring-2 focus:ring-(--primary)/40 focus:outline-none"
                        >
                          Lien
                        </a>
                      ) : null}
                    </div>
                    {item.note && (
                      <p className="mt-1 line-clamp-2 text-xs text-(--muted-foreground)">
                        {item.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-(--muted-foreground)">
                Seul toi vois cette section.
              </p>
            </div>
          ) : (
            <p className="relative mt-2 text-sm text-(--muted-foreground)">
              Trouve des idées en pensant a cette personne.
            </p>
          )}
        </motion.section>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-(--primary)" />
            Tirage au sort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasDraw ? (
            <p className="text-sm text-(--muted-foreground)">
              Le tirage a ete effectue. Chacun voit desormais la personne a qui offrir un cadeau.
            </p>
          ) : (
            <p className="text-sm text-(--muted-foreground)">
              Une fois le tirage effectue, chacun verra la personne a qui offrir un cadeau. Les
              listes resteront privees et les reservations anonymes.
            </p>
          )}

          {isAdmin && (
            <form
              action={async (formData) => {
                await launchDraw(formData);
                startTransition(async () => {
                  const fresh = await fetchMyTarget(eventId);
                  if (fresh) {
                    setTarget(fresh);
                    setHasDraw(true);
                  }
                  router.refresh();
                  emitGlobalRefresh();
                });
              }}
              className="mt-2 inline-flex items-center gap-2"
            >
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="slug" value={slug} />

              <DrawButton disabledBase={membersCount < 2 || isRefreshing} hasDraw={hasDraw} />

              {membersCount < 2 && (
                <span className="text-xs text-(--muted-foreground)">
                  Ajoute au moins 2 participants pour lancer le tirage.
                </span>
              )}
            </form>
          )}

          <div className="mt-4 space-y-3 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                Budget : {typeof budgetCents === "number" ? fmtEUR(budgetCents) : "non défini"}
              </p>
              {isAdmin && !isBudgetEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openBudgetEditor}
                  disabled={isBudgetSaving}
                >
                  {budgetCents === null ? "Définir" : "Modifier"}
                </Button>
              )}
            </div>

            {isAdmin && isBudgetEditing && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {chipValues.map((eur) => {
                    const isSelected = customBudgetEuro.trim() === String(eur) && !showCustomBudget;
                    return (
                      <Button
                        key={eur}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={isBudgetSaving}
                        onClick={() => {
                          setCustomBudgetEuro(String(eur));
                          setShowCustomBudget(false);
                          saveBudget(String(eur), { closeAfterSave: true });
                        }}
                      >
                        {eur} €
                      </Button>
                    );
                  })}
                  <Button
                    type="button"
                    variant={showCustomBudget ? "default" : "outline"}
                    size="sm"
                    disabled={isBudgetSaving}
                    onClick={() => {
                      setShowCustomBudget((prev) => !prev);
                      setBudgetError(null);
                    }}
                  >
                    Autre montant
                  </Button>
                </div>

                {showCustomBudget && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customBudgetEuro}
                      onChange={(e) => setCustomBudgetEuro(e.target.value)}
                      onBlur={() => saveBudget(customBudgetEuro, { closeAfterSave: true })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveBudget(customBudgetEuro, { closeAfterSave: true });
                        }
                      }}
                      className="w-40 rounded-md border px-3 py-2 text-sm"
                      placeholder="Budget €"
                      aria-label="Budget Secret Santa en euros"
                      disabled={isBudgetSaving}
                    />
                    <p className="text-xs text-(--muted-foreground)">
                      Montant en euros, entre 5 et 500.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isBudgetSaving}
                    onClick={() => saveBudget("", { closeAfterSave: true })}
                  >
                    Supprimer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBudgetSaving}
                    onClick={cancelBudgetEdit}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {budgetError && <p className="text-xs text-red-600">{budgetError}</p>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {isSecondHandOk && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                Seconde main acceptee
              </span>
            )}
            {isHandmadeOk && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                Fait main accepte
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border">
                ?
              </span>
              Régles du tirage
            </div>
            <ul className="list-disc pl-6 text-sm text-(--muted-foreground)">
              <li>Chaque participant offre un cadeau a une seule personne.</li>
              <li>Personne ne peut se tirer lui-même.</li>
              <li>La personne qui a cree l&apos;evenement peut relancer un tirage.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
