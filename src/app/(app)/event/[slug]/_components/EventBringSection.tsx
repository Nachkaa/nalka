"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    UserPlus,
    CupSoda,
    Utensils,
    Wrench,
    MoreHorizontal,
    Trash2,
    Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BringCategory } from "@prisma/client";

import {
    createBringItem,
    toggleBringParticipation,
    deleteBringItem,
    updateBringItem,
    setBringSectionEnabled,
} from "../actions";

type BringItem = {
    id: string;
    label: string;
    category?: BringCategory | null;
    note?: string | null;
    createdById: string | null;
    bringers: {
        id: string;
        userId: string | null;
        user?: {
            name?: string | null;
            email?: string | null;
        } | null;
    }[];
};

type Member = {
    id: string;
    name: string | null;
    email: string | null;
};

const BRING_CATEGORY_CONFIG: {
    value: BringCategory;
    label: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
        { value: "DRINKS", label: "Boissons", Icon: CupSoda },
        { value: "FOOD", label: "Nourriture", Icon: Utensils },
        { value: "GEAR", label: "Matériel", Icon: Wrench },
        { value: "OTHER", label: "Autre", Icon: MoreHorizontal },
    ];

function getDensity(bringersCount: number, totalMembers: number) {
    if (!totalMembers) return 0;

    if (totalMembers <= 8) {
        return (bringersCount / totalMembers) * 100;
    }

    if (totalMembers <= 20) {
        return (Math.min(bringersCount, 6) / 6) * 100;
    }

    if (totalMembers <= 50) {
        return (
            (Math.log(bringersCount + 1) / Math.log(totalMembers + 1)) * 100
        );
    }

    return (Math.log(bringersCount + 1) / Math.log(10)) * 100;
}

type EventBringSectionProps = {
    eventId: string;
    slug: string;
    items: BringItem[];
    currentUserId?: string;
    canContribute: boolean;
    totalMembers: number;
    isAdmin: boolean;
    members: Member[];
};

export function EventBringSection({
    eventId,
    slug,
    items,
    currentUserId,
    canContribute,
    totalMembers,
    isAdmin,
    members,
}: EventBringSectionProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editMode, setEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState<BringItem | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const hasItems = items.length > 0;

    if (!canContribute && items.length === 0) return null;

    // --- ACTIONS --------------------------------------------------

    const handleCreate = (formData: FormData) => {
        const label = String(formData.get("label") || "");
        const category = formData.get("category") as BringCategory;
        const note = String(formData.get("note") || "");

        startTransition(async () => {
            await createBringItem({
                eventId,
                label,
                category: category!,
                note,
            });
            setCreateOpen(false);
            setEditMode(false)
            router.refresh();
        });
    };

    const handleToggle = (itemId: string) => {
        startTransition(async () => {
            await toggleBringParticipation({ itemId });
            router.refresh();
        });
    };

    const handleDelete = (itemId: string) => {
        startTransition(async () => {
            await deleteBringItem({ itemId });
            router.refresh();
        });
    };

    const handleUpdate = (formData: FormData) => {
        if (!editingItem) return;

        const label = String(formData.get("label") || "");
        const category = formData.get("category") as BringCategory;
        const note = String(formData.get("note") || "");
        const bringerIds = formData.getAll("bringers").map((v) => String(v));

        startTransition(async () => {
            await updateBringItem({
                itemId: editingItem.id,
                label,
                category,
                note,
                bringerIds,
            });
            setEditingItem(null);
            router.refresh();
        });
    };

    const handleDisableSection = () => {
        startTransition(async () => {
            await setBringSectionEnabled({
                eventId,
                slug,
                enabled: false,
            });
            router.refresh();
        });
    };

    // --- GROUPING -------------------------------------------------

    const groupedByCategory = BRING_CATEGORY_CONFIG
        .map((cfg) => ({
            ...cfg,
            items: items.filter((item) => {
                if (!item.category) return cfg.value === "OTHER";
                return item.category === cfg.value;
            }),
        }))
        .filter((group) => group.items.length > 0);

    // --- RENDER ---------------------------------------------------

    return (
        <Card className="mt-6">
            <CardHeader className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        Qui ramène quoi ?
                    </CardTitle>
                    {editMode && (
                        <p className="text-xs text-muted-foreground">
                            Mode édition — touche un élément pour le modifier
                        </p>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2">
                        {hasItems && !editMode && (
                            <>
                                {/* Mobile : pastille ronde avec pen seul */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditMode((v) => !v)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full sm:hidden"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                        Modifier les choix
                                    </span>
                                </Button>

                                {/* Desktop : bouton texte + icône */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditMode((v) => !v)}
                                    className="hidden h-8 items-center gap-2 rounded-full px-3 sm:inline-flex"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Modifier les choix</span>
                                </Button>
                            </>
                        )}

                        {/* Désactivation accessible seulement quand il n’y a aucun élément */}
                        {!hasItems && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-[var(--destructive)]"
                                    >
                                        Désactiver
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Désactiver “Qui ramène quoi” ?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            La section ne sera plus visible pour les invités. Tu
                                            pourras la réactiver plus tard sans perdre les éléments.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDisableSection}>
                                            Désactiver la section
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {items.length === 0 ? (
                    <div className="flex items-center justify-between rounded-xl border border-dashed px-4 py-3 text-xs">
                        <div>
                            <p className="font-medium">Rien de prévu pour l’instant.</p>
                            <p className="text-muted-foreground">
                                Ajoute ce que chacun peut ramener pour organiser l’événement.
                            </p>
                        </div>

                        {canContribute && (
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="text-xs">
                                        Ajouter un premier élément
                                    </Button>
                                </DialogTrigger>
                                {/* même contenu de dialog que plus haut */}
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Ajouter un élément</DialogTitle>
                                    </DialogHeader>
                                    <form action={handleCreate} className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Intitulé</label>
                                            <Input
                                                name="label"
                                                required
                                                placeholder="Ex. Bouteille de vin, Salade composée…"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-sm font-medium">Catégorie</span>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {BRING_CATEGORY_CONFIG.map(
                                                    ({ value, label, Icon }, index) => (
                                                        <label key={value} className="cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="category"
                                                                value={value}
                                                                className="peer sr-only"
                                                                defaultChecked={index === 0}
                                                                required={index === 0}
                                                            />
                                                            <span
                                                                className={cn(
                                                                    "inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors",
                                                                    "text-muted-foreground bg-white/40 border-input",
                                                                    "peer-checked:border-[var(--primary)]",
                                                                    "peer-checked:bg-[color-mix(in_oklch,var(--primary),white_85%)]",
                                                                    "peer-checked:text-[var(--primary)]",
                                                                    "peer-checked:shadow-sm peer-checked:shadow-[color-mix(in_oklch,var(--primary),black_15%)]",
                                                                )}
                                                            >
                                                                <Icon
                                                                    className="h-3.5 w-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                                {label}
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">
                                                Note (optionnel)
                                            </label>
                                            <Textarea
                                                name="note"
                                                placeholder="Sans gluten, prévoir des verres…"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="w-full"
                                                disabled={isPending}
                                            >
                                                Créer
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {groupedByCategory.map((group) => (
                            <section key={group.value} className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <div className="inline-flex items-center gap-2">
                                        <group.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                        <span className="font-medium">{group.label}</span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                        {group.items.length} élément
                                        {group.items.length > 1 ? "s" : ""}
                                    </span>
                                </div>

                                <ul className="space-y-2">
                                    {group.items.map((item) => {
                                        const currentUserBrings = item.bringers.some(
                                            (b) => b.userId && b.userId === currentUserId,
                                        );

                                        const bringersLabel =
                                            item.bringers.length > 0
                                                ? item.bringers
                                                    .map((b) => {
                                                        const base =
                                                            b.user?.name ||
                                                            b.user?.email?.split("@")[0] ||
                                                            "Invité";
                                                        return b.userId === currentUserId
                                                            ? `${base} (toi)`
                                                            : base;
                                                    })
                                                    .join(", ")
                                                : "";

                                        const clickable =
                                            canContribute && !!currentUserId && !editMode;
                                        const bringersCount = item.bringers.length;
                                        const canManageItem = !!currentUserId && isAdmin;

                                        const densityWidth = getDensity(
                                            bringersCount,
                                            totalMembers,
                                        );

                                        const rowOnClick =
                                            editMode && canManageItem
                                                ? () => setEditingItem(item)
                                                : clickable
                                                    ? () => handleToggle(item.id)
                                                    : undefined;

                                        const rowDisabled =
                                            isPending ||
                                            (!clickable && !(editMode && canManageItem));

                                        return (
                                            <li key={item.id}>
                                                <div className="flex items-center gap-2">
                                                    {/* LIGNE PRINCIPALE */}
                                                    <button
                                                        type="button"
                                                        onClick={rowOnClick}
                                                        disabled={rowDisabled}
                                                        className={cn(
                                                            "relative flex w-full flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg border px-3 py-2 text-sm text-left transition",
                                                            clickable &&
                                                            "cursor-pointer hover:bg-[color-mix(in_oklch,var(--primary),white_96%)] active:bg-[color-mix(in_oklch,var(--primary),white_92%)]",
                                                            currentUserBrings &&
                                                            "border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_92%)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary),white_70%)]",
                                                            "relative flex w-full flex-1 items-center justify-between gap-3 overflow-hidden rounded-lg border px-3 py-2 text-sm text-left transition",
                                                            editMode && "cursor-pointer hover:bg-muted/60 active:bg-muted",
                                                        )}
                                                    >
                                                        {bringersCount > 0 && (
                                                            <div
                                                                aria-hidden="true"
                                                                className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg bg-[var(--primary)]/8"
                                                                style={{
                                                                    width: `${densityWidth}%`,
                                                                    transition: "width 0.5s ease",
                                                                }}
                                                            />
                                                        )}

                                                        <div className="relative space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-medium">
                                                                    {item.label}
                                                                </span>
                                                                {bringersCount > 0 && (
                                                                    <span className="inline-flex items-center rounded-full bg-[var(--accent)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                                                                        {bringersCount} personne
                                                                        {bringersCount > 1 && "s"}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {item.note && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.note}
                                                                </p>
                                                            )}

                                                            {bringersCount > 0 && (
                                                                <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                                                    <UserPlus className="mr-1 h-3 w-3" />
                                                                    {bringersLabel}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {clickable && (
                                                            <span
                                                                className={cn(
                                                                    "relative inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium",
                                                                    currentUserBrings
                                                                        ? "border-[var(--primary)] bg-white/85 text-[var(--primary)]"
                                                                        : "border-[var(--border)] bg-white/70 text-muted-foreground",
                                                                )}
                                                            >
                                                                {currentUserBrings
                                                                    ? "J’annule"
                                                                    : "Je ramène ça"}
                                                            </span>
                                                        )}
                                                    </button>

                                                    {/* BOUTON SUPPRIMER ITEM : séparé pour éviter <button> dans <button> */}
                                                    {editMode && canManageItem && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                    }}
                                                                    aria-label="Supprimer cet élément"
                                                                >
                                                                    <Trash2 className="h-4 w-4 cursor-pointer" />
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Supprimer cet élément ?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        « {item.label} » sera retiré de la liste.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>
                                                                        Annuler
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        Supprimer
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}
                        {isAdmin && canContribute && !editMode && (
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        className="mt-2 w-full justify-center text-xs sm:w-auto"
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        Ajouter un élément
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Ajouter un élément</DialogTitle>
                                    </DialogHeader>
                                    <form action={handleCreate} className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Intitulé</label>
                                            <Input
                                                name="label"
                                                required
                                                placeholder="Ex. Bouteille de vin, Salade composée…"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-sm font-medium">Catégorie</span>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {BRING_CATEGORY_CONFIG.map(
                                                    ({ value, label, Icon }, index) => (
                                                        <label key={value} className="cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="category"
                                                                value={value}
                                                                className="peer sr-only"
                                                                defaultChecked={index === 0}
                                                                required={index === 0}
                                                            />
                                                            <span
                                                                className={cn(
                                                                    "inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors",
                                                                    "text-muted-foreground bg-white/40 border-input",
                                                                    "peer-checked:border-[var(--primary)]",
                                                                    "peer-checked:bg-[color-mix(in_oklch,var(--primary),white_85%)]",
                                                                    "peer-checked:text-[var(--primary)]",
                                                                    "peer-checked:shadow-sm peer-checked:shadow-[color-mix(in_oklch,var(--primary),black_15%)]",
                                                                )}
                                                            >
                                                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                                                {label}
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">
                                                Note (optionnel)
                                            </label>
                                            <Textarea
                                                name="note"
                                                placeholder="Sans gluten, prévoir des verres…"
                                                rows={2}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="w-full"
                                                disabled={isPending}
                                            >
                                                Créer
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Footer actions : uniquement en mode édition avec des éléments */}
            {isAdmin && hasItems && editMode && (
                <CardFooter className="border-t pt-4 pb-4 sm:pt-3 sm:pb-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setEditMode(false)}
                        disabled={isPending}
                    >
                        Sauvegarder
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full text-[11px] text-[var(--destructive)] hover:bg-[var(--destructive)]/5 sm:w-auto"
                            >
                                Désactiver
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Désactiver “Qui ramène quoi” ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    La section ne sera plus visible pour les invités. Tu
                                    pourras la réactiver plus tard sans perdre les éléments.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDisableSection}>
                                    Désactiver la section
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}

            {/* MODALE D’ÉDITION */}
            {isAdmin && (
                <Dialog
                    open={!!editingItem}
                    onOpenChange={(open) => {
                        if (!open) setEditingItem(null);
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifier l’élément</DialogTitle>
                        </DialogHeader>

                        {editingItem && (
                            <form action={handleUpdate} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Intitulé</label>
                                    <Input
                                        name="label"
                                        required
                                        defaultValue={editingItem.label}
                                        placeholder="Ex. Bouteille de vin, Salade composée…"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-medium">Catégorie</span>

                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {BRING_CATEGORY_CONFIG.map(
                                            ({ value, label, Icon }, index) => (
                                                <label key={value} className="cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        value={value}
                                                        className="peer sr-only"
                                                        defaultChecked={
                                                            editingItem.category
                                                                ? editingItem.category === value
                                                                : index === 0
                                                        }
                                                        required={index === 0}
                                                    />
                                                    <span
                                                        className={cn(
                                                            "inline-flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors",
                                                            "text-muted-foreground bg-white/40 border-input",
                                                            "peer-checked:border-[var(--primary)]",
                                                            "peer-checked:bg-[color-mix(in_oklch,var(--primary),white_85%)]",
                                                            "peer-checked:text-[var(--primary)]",
                                                            "peer-checked:shadow-sm peer-checked:shadow-[color-mix(in_oklch,var(--primary),black_15%)]",
                                                        )}
                                                    >
                                                        <Icon
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        {label}
                                                    </span>
                                                </label>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">
                                        Note (optionnel)
                                    </label>
                                    <Textarea
                                        name="note"
                                        defaultValue={editingItem.note ?? ""}
                                        placeholder="Sans gluten, prévoir des verres…"
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <span className="text-sm font-medium">Qui ramène ?</span>
                                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border bg-white/60 p-2">
                                        {members.map((m) => {
                                            const label =
                                                m.name?.trim() ||
                                                m.email?.split("@")[0] ||
                                                "Invité";

                                            const isChecked = editingItem.bringers.some(
                                                (b) => b.userId === m.id,
                                            );

                                            return (
                                                <label
                                                    key={m.id}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="bringers"
                                                        value={m.id}
                                                        defaultChecked={isChecked}
                                                        className="h-3.5 w-3.5 rounded border-input"
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="w-full"
                                        disabled={isPending}
                                    >
                                        Enregistrer
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}
