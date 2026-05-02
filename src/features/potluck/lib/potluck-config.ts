import { CupSoda, MoreHorizontal, Utensils, Wrench } from "lucide-react";

export const POTLUCK_CATEGORIES = [
  { value: "DRINKS", label: "Boissons", Icon: CupSoda },
  { value: "FOOD", label: "Nourriture", Icon: Utensils },
  { value: "GEAR", label: "Matériel", Icon: Wrench },
  { value: "OTHER", label: "Autre", Icon: MoreHorizontal },
] as const;

export type PotluckCategoryConfig = (typeof POTLUCK_CATEGORIES)[number];
