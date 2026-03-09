// app/(app)/event/[slug]/bring/_components/bring-create-dialog.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRING_CATEGORIES } from "../_lib/bring-config";

type BringCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
};

export function BringCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: BringCreateDialogProps) {
  const [category, setCategory] = useState<string>("DRINKS");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un élément</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select name="category" value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRING_CATEGORIES.map(({ value, label, Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">
                Nom de l&apos;élément <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                name="label"
                placeholder="Ex: Bouteilles d'eau"
                required
                autoFocus
              />
            </div>

            {/* Note (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea id="note" name="note" placeholder="Ex: 6 bouteilles d'1,5L" rows={2} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
