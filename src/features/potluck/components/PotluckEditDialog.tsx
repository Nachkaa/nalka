"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { POTLUCK_CATEGORIES } from "../lib/potluck-config";
import { formatBringerName } from "../lib/potluck-utils";
import type { PotluckItem, PotluckParticipant } from "../types";

type PotluckEditDialogProps = {
  item: PotluckItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  currentUserId?: string;
  members: PotluckParticipant[];
};

export function PotluckEditDialog({
  item,
  onOpenChange,
  onSubmit,
  isPending,
  currentUserId,
  members,
}: PotluckEditDialogProps) {
  if (!item) return null;

  return (
    <PotluckEditDialogInner
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

type PotluckEditDialogInnerProps = Omit<PotluckEditDialogProps, "item"> & {
  item: NonNullable<PotluckEditDialogProps["item"]>;
};

function PotluckEditDialogInner({
  item,
  onOpenChange,
  onSubmit,
  isPending,
  currentUserId,
  members,
}: PotluckEditDialogInnerProps) {
  const [category, setCategory] = useState<string>(item.category);
  const [selectedBringers, setSelectedBringers] = useState<string[]>(
    item.bringers.map((bringer) => bringer.userId),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    selectedBringers.forEach((userId) => {
      formData.append("bringers", userId);
    });
    onSubmit(formData);
  };

  const toggleBringer = (userId: string) => {
    setSelectedBringers((current) =>
      current.includes(userId)
        ? current.filter((entry) => entry !== userId)
        : [...current, userId],
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
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select name="category" value={category} onValueChange={setCategory} required>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POTLUCK_CATEGORIES.map(({ value, label, Icon }) => (
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

            <div className="space-y-2">
              <Label htmlFor="edit-label">
                Nom de l&apos;élément <span className="text-destructive">*</span>
              </Label>
              <Input id="edit-label" name="label" defaultValue={item.label} required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (optionnel)</Label>
              <Textarea id="edit-note" name="note" defaultValue={item.note ?? ""} rows={2} />
            </div>

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
