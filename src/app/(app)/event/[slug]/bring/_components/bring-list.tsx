// app/(app)/event/[slug]/bring/_components/bring-list.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BRING_CATEGORIES } from "../_lib/bring-config";
import { BringItem } from "./bring-item";
import type { BringListItem } from "./bring-item";
import type { BringCategory } from "@prisma/client";

type BringListProps = {
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
  currentUserId?: string;
  totalMembers: number;
  canContribute: boolean;
  editMode: boolean;
  canManage: boolean;
  onToggle: (itemId: string) => void;
  onEdit: (item: BringListItem) => void;
  onDelete: (itemId: string) => void;
  isPending: boolean;
};

export function BringList({
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
}: BringListProps) {
  const itemsByCategory = BRING_CATEGORIES.map((cat) => ({
    ...cat,
    items: items
      .filter((item) => item.category === cat.value)
      .sort((a, b) => {
        const countA = a.bringers.length;
        const countB = b.bringers.length;
        if (countB !== countA) {
          return countB - countA;
        }
        return a.label.localeCompare(b.label);
      }),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-6">
      {itemsByCategory.map(({ value, label, Icon, items: categoryItems }) => (
        <div key={value} className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </div>

          {/* ✅ motion.ul contient motion.li */}
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
                  className="relative" // ✅ On déplace la classe ici
                >
                  {/* ✅ BringItem retourne juste un <div> */}
                  <BringItem
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
