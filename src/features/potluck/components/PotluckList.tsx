"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { PotluckItem as PotluckItemType } from "../types";
import { POTLUCK_CATEGORIES } from "../lib/potluck-config";
import { PotluckItem } from "./PotluckItem";

type PotluckListProps = {
  items: PotluckItemType[];
  currentUserId?: string;
  totalMembers: number;
  canContribute: boolean;
  editMode: boolean;
  canManage: boolean;
  onToggle: (itemId: string) => void;
  onEdit: (item: PotluckItemType) => void;
  onDelete: (itemId: string) => void;
  isPending: boolean;
};

export function PotluckList({
  items,
  currentUserId,
  totalMembers,
  canContribute,
  editMode,
  canManage,
  onToggle,
  onEdit,
  onDelete,
  isPending,
}: PotluckListProps) {
  const itemsByCategory = POTLUCK_CATEGORIES.map((category) => ({
    ...category,
    items: items
      .filter((item) => item.category === category.value)
      .sort((left, right) => {
        const countLeft = left.bringers.length;
        const countRight = right.bringers.length;
        if (countRight !== countLeft) {
          return countRight - countLeft;
        }
        return left.label.localeCompare(right.label);
      }),
  })).filter((category) => category.items.length > 0);

  return (
    <div className="space-y-6">
      {itemsByCategory.map(({ value, label, Icon, items: categoryItems }) => (
        <div key={value} className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </div>

          <motion.ul className="space-y-2" layout>
            <AnimatePresence mode="popLayout">
              {categoryItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    },
                    opacity: { duration: 0.2 },
                  }}
                  className="relative"
                >
                  <PotluckItem
                    item={item}
                    currentUserId={currentUserId}
                    totalMembers={totalMembers}
                    canContribute={canContribute}
                    canEdit={canManage || item.createdById === currentUserId}
                    canDelete={
                      canManage || (item.createdById === currentUserId && item.bringers.length <= 1)
                    }
                    editMode={editMode}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isPending={isPending}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      ))}
    </div>
  );
}
