"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        404 — Page introuvable
      </span>

      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        Oups. Cette page n’existe pas.
      </h1>

      <p className="text-pretty text-muted-foreground">
        Le lien est peut-être erroné ou la page a été déplacée.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={() => router.back()} aria-label="Revenir en arrière">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Revenir
        </Button>
        <Button asChild aria-label="Aller à l’accueil"> 
          <Link href="/">
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Accueil
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Si le problème persiste, écris-nous : <a className="underline" href="mailto:contact@nalka.app">contact@nalka.fr</a>
      </p>

      {/* noindex pour la 404 */}
      <span className="sr-only">
        <meta name="robots" content="noindex, nofollow" />
      </span>
    </main>
  );
}
