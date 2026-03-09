// app/(app)/event/[slug]/bring/_components/bring-edit-dialog.tsx

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRING_CATEGORIES } from "../_lib/bring-config";
import { formatBringerName } from "../_lib/bring-utils";

type BringEditDialogProps = {
  item: {
    id: string;
    label: string;
    category: string;
    note?: string | null;
    bringers: {
      id: string;
      userId: string;
      user?: { name?: string | null; email?: string | null } | null;
    }[];
  } | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  currentUserId?: string;
  members: Array<{
    id: string;
    userId: string;
    user: { name?: string | null; email?: string | null } | null;
  }>;
};

export function BringEditDialog({
  item,
  onOpenChange,
  onSubmit,
  isPending,
  currentUserId,
  members,
}: BringEditDialogProps) {
  if (!item) return null;

  return (
    <BringEditDialogInner
      key={item.id}
      item={item}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isPending={isPending}
      currentUserId={currentUserId}
      members={members}
    />
  );
}

type BringEditDialogInnerProps = Omit<BringEditDialogProps, "item"> & {
  item: NonNullable<BringEditDialogProps["item"]>;
};

function BringEditDialogInner({
  item,
  onOpenChange,
  onSubmit,
  isPending,
  currentUserId,
  members,
}: BringEditDialogInnerProps) {
  const [category, setCategory] = useState<string>(item.category);
  const [selectedBringers, setSelectedBringers] = useState<string[]>(
    item.bringers.map((b) => b.userId),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Ajouter les bringers sélectionnés
    selectedBringers.forEach((userId) => {
      formData.append("bringers", userId);
    });

    onSubmit(formData);
  };

  const toggleBringer = (userId: string) => {
    setSelectedBringers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;élément</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select name="category" value={category} onValueChange={setCategory} required>
                <SelectTrigger id="edit-category">
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
              <Label htmlFor="edit-label">
                Nom de l&apos;élément <span className="text-destructive">*</span>
              </Label>
              <Input id="edit-label" name="label" defaultValue={item.label} required autoFocus />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (optionnel)</Label>
              <Textarea id="edit-note" name="note" defaultValue={item.note ?? ""} rows={2} />
            </div>

            {/* Liste des participants */}
            <div className="space-y-2">
              <Label>Qui ramène cet élément ?</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {members.map((member) => {
                  const isSelected = selectedBringers.includes(member.userId);
                  const displayName = formatBringerName(
                    member.user,
                    member.userId === currentUserId,
                  );

                  return (
                    <div key={member.userId} className="flex items-center gap-2">
                      <Checkbox
                        id={`bringer-${member.userId}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleBringer(member.userId)}
                      />
                      <Label
                        htmlFor={`bringer-${member.userId}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {displayName}
                      </Label>
                    </div>
                  );
                })}
              </div>
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
              {isPending ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
