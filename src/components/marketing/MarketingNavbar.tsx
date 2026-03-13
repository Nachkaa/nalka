import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export function MarketingNavbar() {
  return (
    <header className="supports-backdrop-filter:bg-background/80 border-b bg-white backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[color-mix(in_oklch,var(--primary),black_4%)]"
        >
          Nalka
        </Link>

        <nav className="text-muted-foreground hidden items-center gap-8 text-sm md:flex">
          <Link href="#fonctionnement" className="hover:text-foreground">
            Fonctionnement
          </Link>
          <Link href="#confidentialite-privee" className="hover:text-foreground">
            Confidentialite
          </Link>
          <Link href="#idees-evenements" className="hover:text-foreground">
            Exemples d&apos;evenements
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="link" className="text-foreground px-0 text-sm font-medium">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm" className="shadow-soft text-sm">
            <Link href="/event/new">Creer un evenement</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
