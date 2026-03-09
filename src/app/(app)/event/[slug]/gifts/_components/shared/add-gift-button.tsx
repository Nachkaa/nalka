// app/(app)/event/[slug]/gifts/_components/shared/add-gift-button.tsx

import Link from "next/link";

type Props = {
  slug: string;
  className?: string;
};

export function AddGiftButton({ slug, className }: Props) {
  return (
    <Link
      href={`/event/${slug}/gifts/add`}
      className={
        className ??
        "mt-4 block rounded-lg bg-[var(--primary)] py-3 text-center font-medium text-[var(--primary-foreground)] transition hover:bg-[color-mix(in_oklch,var(--primary),black_10%)]"
      }
    >
      Ajouter une idée
    </Link>
  );
}
