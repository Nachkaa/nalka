// components/layout/Container.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

export function Container({
  className,
  size = "lg",
  ...props
}: React.ComponentProps<"div"> & { size?: Size }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-2 md:px-6",
        size === "sm" && "max-w-3xl",
        size === "md" && "max-w-5xl",
        size === "lg" && "max-w-6xl",
        className,
      )}
      {...props}
    />
  );
}
