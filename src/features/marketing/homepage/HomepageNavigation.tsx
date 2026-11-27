"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./homepage.module.css";

const links = [
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#confidentialite", label: "Les surprises" },
  { href: "#occasions", label: "Toute l’année" },
] as const;

export function HomepageNavigation({ href, label }: { href: string; label: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const desktop = window.matchMedia("(min-width: 860px)");
    const closeMenu = () => {
      if (menuRef.current) menuRef.current.open = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        closeMenu();
        menuRef.current?.querySelector("summary")?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) closeMenu();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    desktop.addEventListener("change", closeMenu);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      desktop.removeEventListener("change", closeMenu);
    };
  }, []);

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.navInner}>
        <Link href="/" aria-label="Nalka, accueil" className={styles.wordmark}>
          Nalka
        </Link>
        <nav aria-label="Navigation principale" className={styles.desktopLinks}>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.desktopActions}>
          <Link href="/login">Se connecter</Link>
          <Link href={href} className={styles.primaryButton}>
            {label}
          </Link>
        </div>
        <details ref={menuRef} className={styles.mobileMenu}>
          <summary className={styles.menuButton}>
            <span className={styles.closedMenuLabel}>Menu</span>
            <span className={styles.openMenuLabel}>Fermer</span>
          </summary>
          <nav aria-label="Navigation mobile" className={styles.mobileLinks}>
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            <Link href="/login" onClick={closeMenu}>
              Se connecter
            </Link>
            <Link href={href} onClick={closeMenu} className={styles.primaryButton}>
              {label}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
