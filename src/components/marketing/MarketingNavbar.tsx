import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  return (
    <header className="supports-backdrop-filter:bg-background/80 bg-background border-b backdrop-blur">
      <Container className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[color-mix(in_oklch,var(--primary),black_4%)]"
        >
          Nalka
        </Link>

        <nav
          aria-label="Navigation principale"
          className="text-muted-foreground hidden items-center gap-8 text-sm lg:flex"
        >
          <Link href="#modules-evenement" className="hover:text-foreground">
            Cadeaux et préparatifs
          </Link>
          <Link href="#fonctionnement" className="hover:text-foreground">
            Fonctionnement
          </Link>
          <Link href="#confidentialite-privee" className="hover:text-foreground">
            Les surprises
          </Link>
          <Link href="#idees-evenements" className="hover:text-foreground">
            Nos moments ensemble
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="link" className="text-foreground px-0 text-sm font-medium">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm" className="shadow-soft hidden text-sm sm:inline-flex">
            <Link href="/event/new">Créer un événement</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
