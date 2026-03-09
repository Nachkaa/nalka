// app/(app)/event/[slug]/bring/_lib/bring-config.ts

import { CupSoda, Utensils, Wrench, MoreHorizontal } from "lucide-react";

export const BRING_CATEGORIES = [
  { value: "DRINKS", label: "Boissons", Icon: CupSoda },
  { value: "FOOD", label: "Nourriture", Icon: Utensils },
  { value: "GEAR", label: "Matériel", Icon: Wrench },
  { value: "OTHER", label: "Autre", Icon: MoreHorizontal },
] as const;

export type BringCategoryConfig = (typeof BRING_CATEGORIES)[number];
