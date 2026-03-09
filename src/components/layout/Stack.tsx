// components/layout/Stack.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type Gap = "xs" | "sm" | "md" | "lg";

export function Stack({
  className,
  gap = "md",
  ...props
}: React.ComponentProps<"div"> & { gap?: Gap }) {
  return (
    <div
      className={cn(
        "flex flex-col",
        gap === "xs" && "gap-2",
        gap === "sm" && "gap-3",
        gap === "md" && "gap-6",
        gap === "lg" && "gap-10",
        className,
      )}
      {...props}
    />
  );
}
