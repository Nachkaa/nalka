// src/components/ui/checkbox-card.tsx

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type CheckboxCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function CheckboxCard({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}: CheckboxCardProps) {
  const id = `checkbox-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
        checked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60"
      }`}
      onClick={() => onCheckedChange(!checked)}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <div className="flex-1">
        <Label htmlFor={id} className="flex cursor-pointer items-center gap-2 font-medium">
          <span className="text-primary">{icon}</span>
          {title}
        </Label>
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </div>
    </div>
  );
}
