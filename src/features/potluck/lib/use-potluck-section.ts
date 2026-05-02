"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BringCategory } from "@prisma/client";
import { toast } from "sonner";

import {
  createBringItem,
  deleteBringItem,
  toggleBringParticipation,
  updateBringItem,
} from "../server/mutations";
import type { PotluckItem } from "../types";

export function usePotluckSection(
  eventId: string,
  slug: string,
  deactivateModule?: (() => Promise<{ ok: boolean; error?: string }>) | null,
) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PotluckItem | null>(null);
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
    if (!deactivateModule) return;

    startTransition(async () => {
      const result = await deactivateModule();

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
