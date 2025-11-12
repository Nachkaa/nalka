"use client";

import { useState, useTransition, useRef, FormEvent } from "react";
import { updateEvent } from "./actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2  } from "lucide-react";
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
import { deleteEvent } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, EyeOff, Eye, Recycle, Hammer } from "lucide-react";

type Props = {
  slug: string;
  event: {
    id: string;
    title: string;
    description: string | null;
    eventOnISO: string | null;
    location: string | null;
    isNoSpoil: boolean;
    isAnonReservations: boolean;
    isSecondHandOk: boolean;
    isHandmadeOk: boolean;
    isSecretSanta: boolean; 
    budgetCapCents: number | null;
  };
};

function CheckboxCard({
  name,
  title,
  help,
  icon,
  defaultChecked = false,
  checked: controlled,
  onCheckedChange,
}: {
  name: string;
  title: React.ReactNode;
  help?: string;
  icon?: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
}) {
  const [internal, setInternal] = useState<boolean>(defaultChecked);
  const checked = controlled ?? internal;
  const setChecked = (v: boolean) => (onCheckedChange ? onCheckedChange(v) : setInternal(v));
  const cbRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="relative group cursor-pointer">
      <button type="button" aria-hidden tabIndex={-1} className="absolute inset-0 rounded-xl" onClick={() => cbRef.current?.click()} />
      <div className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${checked ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm" : "bg-card border-[var(--border)] hover:bg-muted/60"}`}>
        {icon ? <span className="text-[var(--primary)] flex-shrink-0">{icon}</span> : null}
        <div className="flex-1">
          <Label className="font-medium">{title}</Label>
          {help ? <p className="text-sm text-muted-foreground">{help}</p> : null}
        </div>
        <Checkbox ref={cbRef} checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} className="pointer-events-none data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]" />
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      </div>
    </div>
  );
}

export default function EditEventDialog({ slug, event }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tzOffsetMs = new Date().getTimezoneOffset() * 60_000;
  const todayISO = new Date(Date.now() - tzOffsetMs).toISOString().slice(0, 10);
  const [secretSanta, setSecretSanta] = useState(event.isSecretSanta);

  async function onSubmit(fd: FormData) {
    const res = await updateEvent(event.id, slug, fd); // must return { ok: true }
    if (res?.ok) {
      startTransition(() => {
        router.refresh(); // force SSR data refresh (anon names, rules, etc.)
        setOpen(false);
      });
    }
  }

  const dateDefault =
      event.eventOnISO ? new Date(event.eventOnISO).toISOString().slice(0, 10) : "";

    const budgetDefault =
      typeof event.budgetCapCents === "number"
        ? (event.budgetCapCents / 100).toString()
        : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier l’événement</DialogTitle>
        </DialogHeader>

        <form action={onSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={event.title} required maxLength={120} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={event.description ?? ""} rows={3} maxLength={500} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={dateDefault}
                min={todayISO}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input id="location" name="location" placeholder="Ex. Chez Marie" defaultValue={event.location ?? ""} />
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">Règles des cadeaux</legend>
  <p className="text-sm text-muted-foreground">Ces paramètres s’appliquent aux cadeaux de cet événement.</p>

  {/* Mode */}
  <div className="space-y-3">
    <Label className="text-base font-medium">Mode</Label>
    <div className="grid gap-2 sm:grid-cols-2">
      <CheckboxCard
        name="rules.isSecretSanta"
        title="Secret Santa"
        icon={<Sparkles className="h-5 w-5" />}
        help="Tirage au sort des duos. Les listes restent privées."
        checked={secretSanta}
        onCheckedChange={setSecretSanta}
      />
    </div>
  </div>

  {/* Visibilité */}
  <div className="space-y-3">
    <Label className="text-base font-medium">Visibilité</Label>
    {secretSanta ? (
      <>
        {/* forcé si Secret Santa */}
        <input type="hidden" name="rules.isNoSpoil" value="true" />
        <input type="hidden" name="rules.isAnonReservations" value="true" />
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Mode Secret Santa activé : les noms sont masqués et votre propre liste ne montre pas les réservations.
        </div>
      </>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2">
                  <CheckboxCard
                    name="rules.isNoSpoil"
                    title="Cadeaux cachés dans ma liste"
                    icon={<EyeOff className="h-5 w-5" />}
                    help="Je ne vois pas quels cadeaux de ma propre liste ont été réservés."
                    defaultChecked={event.isNoSpoil}
                  />
                  <CheckboxCard
                    name="rules.isAnonReservations"
                    title="Réservations anonymes"
                    icon={<Eye className="h-5 w-5" />}
                    help="Les invités voient qu’un cadeau est réservé sans savoir par qui."
                    defaultChecked={event.isAnonReservations}
                  />
                </div>
              )}
            </div>
            
            {/* Cadeaux acceptés */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Cadeaux acceptés</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckboxCard
                  name="rules.isSecondHandOk"
                  title="Seconde main acceptée"
                  icon={<Recycle className="h-5 w-5" />}
                  help="Autoriser les objets d’occasion."
                  defaultChecked={event.isSecondHandOk}
                />
                <CheckboxCard
                  name="rules.isHandmadeOk"
                  title="Fait main accepté"
                  icon={<Hammer className="h-5 w-5" />}
                  help="Autoriser les cadeaux faits main."
                  defaultChecked={event.isHandmadeOk}
                />
              </div>
            </div>
            
            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget maximum par cadeau (€)</Label>
              <Input id="budget" name="rules.budgetCap" inputMode="decimal" placeholder="Ex. 20" defaultValue={budgetDefault} />
            </div>
          </fieldset>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </form>
    
            <div className="mt-4 flex justify-end border-t pt-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Supprimer l’événement
                  </Button>
                </AlertDialogTrigger>
                    
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <span className="font-medium">{event.title}</span> sera supprimé avec toutes les listes et invitations.
                      Cette action est définitive.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <form action={deleteEvent}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <AlertDialogAction asChild>
                        <Button type="submit" variant="destructive">Supprimer</Button>
                      </AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
      </DialogContent>
      
    </Dialog>
  );
}
