import Link from "next/link";

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="text-muted-foreground mx-auto max-w-3xl px-4 pt-8 text-sm"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.name}</span>
              )}
              {!isLast ? <span aria-hidden>&rsaquo;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
