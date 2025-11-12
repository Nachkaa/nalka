"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ThemeSwitch() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = (theme === "system" ? systemTheme : theme) === "dark";

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="theme"
        checked={!!isDark}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        aria-label="Activer le mode sombre"
      />
      <Label htmlFor="theme" className="text-sm text-muted-foreground">
        Mode sombre
      </Label>
    </div>
  );
}
