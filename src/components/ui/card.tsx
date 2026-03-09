// components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type CardSize = "sm" | "md";
type CardVariant = "default" | "ghost";
type CardInset = "default" | "none";

function Card({
  className,
  size = "md",
  variant = "default",
  inset = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: CardSize;
  variant?: CardVariant;
  inset?: CardInset;
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-inset={inset}
      className={cn(
        "group/card text-card-foreground flex flex-col rounded-xl",
        // surface
        "data-[variant=default]:bg-card data-[variant=default]:border data-[variant=default]:shadow-sm",
        "data-[variant=ghost]:border-0 data-[variant=ghost]:bg-transparent data-[variant=ghost]:shadow-none",
        // density
        "gap-6 py-6 data-[size=sm]:gap-3 data-[size=sm]:py-3",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        // inset
        "px-6 group-data-[inset=none]/card:px-0",
        // density
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", "group-data-[size=sm]/card:text-sm", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground text-sm",
        "group-data-[size=sm]/card:text-xs",
        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6 group-data-[inset=none]/card:px-0",
        "group-data-[size=sm]/card:px-4",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center [.border-t]:pt-6",
        // inset
        "px-6 group-data-[inset=none]/card:px-0",
        // density
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:[.border-t]:pt-3",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
