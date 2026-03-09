// app/(app)/event/[slug]/bring/_components/bring-client.tsx

"use client";

import { useState } from "react";
import { Plus, Settings, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBringSection } from "../_lib/use-bring-section";
import { BringList } from "./bring-list";
import { BringCreateDialog } from "./bring-create-dialog";
import { BringEditDialog } from "./bring-edit-dialog";
import { BringDisableAlert } from "./bring-disable-alert";
import { BringEmptyState } from "./bring-empty-state";
import type { BringCategory, EventMemberRole } from "@prisma/client";

type BringClientProps = {
  eventId: string;
  slug: string;
  items: Array<{
    id: string;
    label: string;
    note?: string | null;
    category: BringCategory;
    createdById?: string | null;
    bringers: {
      id: string;
      userId: string;
      user?: { name?: string | null; email?: string | null } | null;
    }[];
  }>;
  members: Array<{
    id: string;
    userId: string;
    user: { name?: string | null; email?: string | null } | null;
  }>;
  currentUserId: string;
  userRole: EventMemberRole;
};

export function BringClient({
  eventId,
  slug,
  items,
  members,
  currentUserId,
  userRole,
}: BringClientProps) {
  const [disableAlertOpen, setDisableAlertOpen] = useState(false);

  const {
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
  } = useBringSection(eventId, slug);

  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";
  const canManage = isOwner || isAdmin;
  const canContribute = !!userRole;
  const totalMembers = members.length;
  const isEmpty = items.length === 0;

  return (
    <>
      <Card>
        <CardHeader className={isEmpty ? "pb-3" : undefined}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">🍽️ Qui ramène quoi</CardTitle>

            {canManage && (
              <div className="flex items-center gap-2">
                {/* ✅ Bouton Gérer (seulement si items > 0) */}
                {!isEmpty && !editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                )}

                {/* ✅ Bouton Fermer (mode édition) */}
                {editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}

                {/* ✅ Bouton Ajouter (toujours visible) */}
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>

                {/* ✅ NOUVEAU : Bouton Désactiver (visible si vide OU en mode édition) */}
                {isOwner && (isEmpty || editMode) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisableAlertOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className={isEmpty ? "pt-0" : undefined}>
          {isEmpty ? (
            <BringEmptyState />
          ) : (
            <BringList
              items={items}
              currentUserId={currentUserId}
              totalMembers={totalMembers}
              canContribute={canContribute}
              editMode={editMode}
              canManage={canManage}
              onToggle={handleToggle}
              onEdit={setEditingItem}
              onDelete={handleDelete}
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BringCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={isPending}
      />

      <BringEditDialog
        item={editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSubmit={handleUpdate}
        isPending={isPending}
        currentUserId={currentUserId}
        members={members}
      />

      <BringDisableAlert
        open={disableAlertOpen}
        onOpenChange={setDisableAlertOpen}
        onConfirm={handleDisable}
        isPending={isPending}
      />
    </>
  );
}
