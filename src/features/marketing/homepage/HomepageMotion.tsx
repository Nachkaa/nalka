"use client";

import { useEffect, useRef, type ReactNode } from "react";

import styles from "./homepage.module.css";

export function HomepageMotion({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 860px) and (min-height: 760px)");
    const story = root.querySelector<HTMLElement>("[data-home-story]");
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-home-step]"));
    const visuals = Array.from(root.querySelectorAll<HTMLElement>("[data-home-step-visual]"));
    const parallax = Array.from(root.querySelectorAll<HTMLElement>("[data-home-parallax]"));
    const animations = new Set<Animation>();
    let frame = 0;
    let active = -1;

    const update = () => {
      frame = 0;
      if (reduced.matches) return;
      const middle = window.innerHeight / 2;

      if (story?.dataset.sticky === "true") {
        const rect = story.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          let nearest = 0;
          let distance = Infinity;
          steps.forEach((step, index) => {
            const bounds = step.getBoundingClientRect();
            const current = Math.max(bounds.top - middle, middle - bounds.bottom, 0);
            if (current < distance) {
              distance = current;
              nearest = index;
            }
          });
          if (active !== nearest) {
            active = nearest;
            steps.forEach((step, index) => {
              step.dataset.active = String(index === active);
            });
            visuals.forEach((visual, index) => {
              visual.dataset.active = String(index === active);
            });
            const counter = story.querySelector("[data-home-step-count]");
            if (counter) counter.textContent = String(active + 1);
            story.querySelectorAll<HTMLElement>("[data-home-step-dot]").forEach((dot, index) => {
              dot.dataset.active = String(index === active);
            });
          }
        }
      }

      parallax.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const offset = Math.max(-24, Math.min(24, (middle - rect.top - rect.height / 2) * 0.04));
        element.style.setProperty("--home-parallax", `${offset}px`);
      });
    };

    const configure = () => {
      if (story) story.dataset.sticky = String(desktop.matches && !reduced.matches);
      active = -1;
      if (reduced.matches) {
        animations.forEach((animation) => animation.cancel());
        parallax.forEach((element) => element.style.removeProperty("--home-parallax"));
      }
      update();
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach(({ isIntersecting, target }) => {
                if (!isIntersecting) return;
                observer?.unobserve(target);
                if (reduced.matches || !(target instanceof HTMLElement) || !target.animate) return;
                const photo = target.dataset.reveal === "photo";
                const animation = target.animate(
                  [
                    { opacity: 0, transform: photo ? "scale(1.02)" : "translateY(14px)" },
                    { opacity: 1, transform: "none" },
                  ],
                  {
                    duration: photo ? 850 : 550,
                    delay: Number(target.dataset.delay || 0),
                    easing: "cubic-bezier(.2,.7,.2,1)",
                    fill: "backwards",
                  },
                );
                animations.add(animation);
                animation.onfinish = () => animations.delete(animation);
              });
            },
            { threshold: 0.06 },
          );

    root.querySelectorAll("[data-reveal]").forEach((element) => observer?.observe(element));
    configure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    reduced.addEventListener("change", configure);
    desktop.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reduced.removeEventListener("change", configure);
      desktop.removeEventListener("change", configure);
    };
  }, []);

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`}>
      {children}
    </div>
  );
}
