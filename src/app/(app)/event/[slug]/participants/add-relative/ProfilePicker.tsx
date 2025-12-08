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

            <fieldset className="space-y-2 rounded-lg border bg-muted/40 px-3 py-3">
                <legend className="text-xs font-medium text-muted-foreground">
                    Utiliser un proche existant
                </legend>
                <p className="text-xs text-muted-foreground">
                    Sélectionne un proche déjà enregistré, ou laisse vide pour en créer un
                    nouveau juste en dessous.
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
                                        : "border-[var(--border)] bg-background",
                                ].join(" ")}
                            >
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--secondary)] text-[0.65rem] font-semibold text-[var(--sidebar-primary)]">
                                    {initialsFromName(p.firstName || "?")}
                                </span>
                                <span>
                                    {p.firstName}
                                    {p.birthYear && (
                                        <span className="ml-1 text-[0.7rem] text-muted-foreground">
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
