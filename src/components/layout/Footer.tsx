"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background/80 border-t">
      <nav
        aria-label="Pied de page"
        className="text-muted-foreground mx-auto max-w-5xl px-4 py-6 text-sm"
      >
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <li>
            <Link
              href="/legal/mentions-legales"
              className="focus:ring-ring rounded underline-offset-4 hover:underline focus:ring-2 focus:outline-none"
            >
              Mentions légales
            </Link>
          </li>
          <li>
            <Link
              href="/legal/cgu"
              className="focus:ring-ring rounded underline-offset-4 hover:underline focus:ring-2 focus:outline-none"
            >
              CGU
            </Link>
          </li>
          <li>
            <Link
              href="/legal/confidentialite"
              className="focus:ring-ring rounded underline-offset-4 hover:underline focus:ring-2 focus:outline-none"
            >
              Confidentialité
            </Link>
          </li>
          <li>
            <Link
              href="/legal/cookies"
              className="focus:ring-ring rounded underline-offset-4 hover:underline focus:ring-2 focus:outline-none"
            >
              Cookies
            </Link>
          </li>
        </ul>

        <p className="mt-4 text-center">© {new Date().getFullYear()} Nalka</p>

        {/* fine tricolor bar above the sentence */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 grid h-[4px] w-24 grid-cols-3 overflow-hidden rounded-sm md:w-32"
        >
          <div className="bg-[#0055A4]" />
          <div className="bg-white" />
          <div className="bg-[#EF4135]" />
        </div>

        <p
          className="mt-2 flex items-center justify-center gap-2 text-center"
          aria-label="Fait avec amour en France"
        >
          <span>
            Fait avec{" "}
            <span role="img" aria-label="cœur">
              ❤️
            </span>{" "}
            en France
          </span>
        </p>
      </nav>
    </footer>
  );
}
