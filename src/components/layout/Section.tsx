// components/layout/Section.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Section({
  title,
  right,
  children,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card size="md" className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        {right ? <div className="shrink-0">{right}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
