// app/(app)/event/[slug]/bring/_lib/use-bring-section.ts

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BringCategory } from "@prisma/client";
import {
  createBringItem,
  updateBringItem,
  deleteBringItem,
  toggleBringParticipation,
} from "../../actions/bring";
import { deactivateBring } from "../../actions/modules";
import type { BringListItem } from "../_components/bring-item";

export function useBringSection(eventId: string, slug: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BringListItem | null>(null);
  const [editMode, setEditMode] = useState(false);

  const readCategory = (value: FormDataEntryValue | null): BringCategory => {
    return String(value ?? "DRINKS") as BringCategory;
  };

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createBringItem({
        eventId,
        slug,
        label: formData.get("label") as string,
        category: readCategory(formData.get("category")),
        note: formData.get("note") as string | undefined,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de la création");
        return;
      }

      toast.success("Élément ajouté !");
      setCreateOpen(false);
      router.refresh();
    });
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingItem) return;

    startTransition(async () => {
      const bringerIds = formData.getAll("bringers") as string[];

      const result = await updateBringItem({
        itemId: editingItem.id,
        eventId,
        slug,
        label: formData.get("label") as string,
        category: readCategory(formData.get("category")),
        note: formData.get("note") as string | undefined,
        bringerIds,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de la modification");
        return;
      }

      toast.success("Élément modifié !");
      setEditingItem(null);
      router.refresh();
    });
  };

  const handleDelete = async (itemId: string) => {
    startTransition(async () => {
      const result = await deleteBringItem({
        itemId,
        eventId,
        slug,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de la suppression");
        return;
      }

      toast.success("Élément supprimé !");
      router.refresh();
    });
  };

  const handleToggle = async (itemId: string) => {
    startTransition(async () => {
      const result = await toggleBringParticipation({
        itemId,
        eventId,
        slug,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur");
        return;
      }

      router.refresh();
    });
  };

  const handleDisable = async () => {
    startTransition(async () => {
      const result = await deactivateBring({ eventId, slug });

      if (!result.ok) {
        toast.error(result.error ?? "Erreur lors de la désactivation");
        return;
      }

      toast.success("Section désactivée !");
      router.refresh();
    });
  };

  return {
    isPending,
    createOpen,
    setCreateOpen,
    editingItem,
    setEditingItem,
    editMode,
    setEditMode,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggle,
    handleDisable,
  };
}
