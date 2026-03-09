// StepHeading.tsx
export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg leading-tight font-medium">{title}</h2>
      {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
    </div>
  );
}
