"use client";

import * as React from "react";

type Profile = {
  id: string;
  firstName: string;
  birthYear: number | null;
};

function initialsFromName(name: string) {
  return name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

type Props = {
  profiles: Profile[];
};

export function ProfilePicker({ profiles }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  function toggle(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* valeur envoyée au serveur */}
      <input type="hidden" name="profileId" value={selectedId ?? ""} />

      <fieldset className="bg-muted/40 space-y-2 rounded-lg border px-3 py-3">
        <legend className="text-muted-foreground text-xs font-medium">
          Utiliser un proche existant
        </legend>
        <p className="text-muted-foreground text-xs">
          Sélectionne un proche déjà enregistré, ou laisse vide pour en créer un nouveau juste en
          dessous.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {profiles.map((p) => {
            const active = selectedId === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={[
                  "flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs transition",
                  active
                    ? "border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary),white_90%)]"
                    : "bg-background border-[var(--border)]",
                ].join(" ")}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-[0.65rem] font-semibold text-[var(--sidebar-primary)]">
                  {initialsFromName(p.firstName || "?")}
                </span>
                <span>
                  {p.firstName}
                  {p.birthYear && (
                    <span className="text-muted-foreground ml-1 text-[0.7rem]">
                      ({p.birthYear})
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </>
  );
}
