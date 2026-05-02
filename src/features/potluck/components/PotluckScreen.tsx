"use client";

import { Plus, Settings, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { usePotluckSection } from "../lib/use-potluck-section";
import type { PotluckModuleProps } from "../types";
import { PotluckCreateDialog } from "./PotluckCreateDialog";
import { PotluckDisableAlert } from "./PotluckDisableAlert";
import { PotluckEditDialog } from "./PotluckEditDialog";
import { PotluckEmptyState } from "./PotluckEmptyState";
import { PotluckList } from "./PotluckList";

type PotluckScreenProps = PotluckModuleProps & {
  deactivateModule?: (() => Promise<{ ok: boolean; error?: string }>) | null;
};

export function PotluckScreen({
  eventId,
  slug,
  items,
  members,
  currentUserId,
  userRole,
  deactivateModule,
}: PotluckScreenProps) {
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
  } = usePotluckSection(eventId, slug, deactivateModule);

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

            {canManage ? (
              <div className="flex items-center gap-2">
                {!isEmpty && !editMode ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                ) : null}

                {editMode ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}

                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>

                {isOwner && deactivateModule && (isEmpty || editMode) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisableAlertOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className={isEmpty ? "pt-0" : undefined}>
          {isEmpty ? (
            <PotluckEmptyState />
          ) : (
            <PotluckList
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

      <PotluckCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={isPending}
      />

      <PotluckEditDialog
        item={editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSubmit={handleUpdate}
        isPending={isPending}
        currentUserId={currentUserId}
        members={members}
      />

      <PotluckDisableAlert
        open={disableAlertOpen}
        onOpenChange={setDisableAlertOpen}
        onConfirm={handleDisable}
        isPending={isPending}
      />
    </>
  );
}
