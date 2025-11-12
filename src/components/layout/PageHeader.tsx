export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mx-auto max-w-3xl px-4 pt-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
