"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Hammer, Recycle, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { emitGlobalRefresh } from "@/lib/refresh";
import { launchDraw } from "../draw";
import { fmtEUR } from "@/lib/formatters";

type TargetItem = {
    id: string;
    title: string;
    url: string | null;
    note: string | null;
};

type MeTarget =
    | {
        receiver: { id: string; name: string | null; email: string | null };
        listId: string | null;
        receiverItems: TargetItem[];
    }
    | null;

type SecretSantaSectionProps = {
    eventId: string;
    slug: string;
    isAdmin: boolean;
    membersCount: number;
    budgetCapCents: number | null;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
};

function DrawButton({
    disabledBase,
    hasDraw,
}: {
    disabledBase: boolean;
    hasDraw: boolean;
}) {
    const { pending } = useFormStatus();

    const label = pending
        ? "Tirage en cours…"
        : hasDraw
            ? "↻ Relancer le tirage"
            : "🎲 Lancer le tirage";

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
        const r = await fetch(`/api/secret-santa/${eventId}/me`, { cache: "no-store" });
        if (!r.ok) return null;
        return (await r.json()) as MeTarget;
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
    const [target, setTarget] = useState<MeTarget>(null);
    const [hasDraw, setHasDraw] = useState<boolean>(false);

    // récupérer mon tirage (si déjà effectué)
    useEffect(() => {
        let alive = true;
        fetchMyTarget(eventId)
            .then((data) => {
                if (alive && data?.receiver) {
                    setTarget(data);
                    setHasDraw(true);
                }
            })
            .catch(() => { });
        return () => {
            alive = false;
        };
    }, [eventId]);

    return (
        <>
            {/* Bloc "tu offres un cadeau à..." */}
            {target && (
                <motion.section
                    aria-labelledby="my-target"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-2xl bg-[color-mix(in_oklch,white_88%,var(--primary))] p-6 shadow-sm ring-1 ring-[var(--primary)]/15"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_-10%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_60%)] opacity-70"
                    />

                    <div className="relative flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                            <h2 id="my-target" className="text-sm font-medium text-[var(--muted-foreground)]">
                                Tu offres un cadeau à
                            </h2>
                            <p className="text-2xl font-bold leading-tight tracking-tight">
                                {displayName(target.receiver)}
                            </p>
                        </div>
                    </div>

                    {target.listId && target.receiverItems.length > 0 ? (
                        <div className="relative mt-4">
                            <h3 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
                                Ses idées
                            </h3>
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {target.receiverItems.map((it) => (
                                    <li
                                        key={it.id}
                                        className="rounded-xl border border-black/5 bg-white/90 px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="truncate font-medium">{it.title}</span>
                                            {it.url ? (
                                                <a
                                                    href={it.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
                                                >
                                                    Lien
                                                </a>
                                            ) : null}
                                        </div>
                                        {it.note && (
                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                                                {it.note}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                                Seul toi vois cette section.
                            </p>
                        </div>
                    ) : (
                        <p className="relative mt-2 text-sm text-[var(--muted-foreground)]">
                            Trouve des idées en pensant à cette personne.
                        </p>
                    )}
                </motion.section>
            )}

            {/* Carte tirage au sort */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                        Tirage au sort
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {hasDraw ? (
                        <p className="text-sm text-[var(--muted-foreground)]">
                            Le tirage a été effectué. Chacun voit désormais la personne à qui offrir un cadeau.
                        </p>
                    ) : (
                        <p className="text-sm text-[var(--muted-foreground)]">
                            Une fois le tirage effectué, chacun verra la personne à qui offrir un cadeau.
                            Les listes resteront privées et les réservations anonymes.
                        </p>
                    )}

                    {isAdmin && (
                        <form
                            action={async (fd) => {
                                await launchDraw(fd);
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

                            <DrawButton
                                disabledBase={membersCount < 2 || isRefreshing}
                                hasDraw={hasDraw}
                            />

                            {membersCount < 2 && (
                                <span className="text-xs text-[var(--muted-foreground)]">
                                    Ajoute au moins 2 participants pour lancer le tirage.
                                </span>
                            )}
                        </form>
                    )}

                    {/* paramètres cadeaux */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {typeof budgetCapCents === "number" && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                                <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
                                Budget max : {fmtEUR(budgetCapCents)}
                            </span>
                        )}
                        {isSecondHandOk && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                                <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                                Seconde main acceptée
                            </span>
                        )}
                        {isHandmadeOk && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
                                <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                                Fait main accepté
                            </span>
                        )}
                    </div>

                    {/* règles */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border">
                                ?
                            </span>
                            Règles du tirage
                        </div>
                        <ul className="list-disc pl-6 text-sm text-[var(--muted-foreground)]">
                            <li>Chaque participant offre un cadeau à une seule personne.</li>
                            <li>Personne ne peut se tirer lui-même.</li>
                            <li>La personne qui a créé l’événement peut relancer un tirage.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
