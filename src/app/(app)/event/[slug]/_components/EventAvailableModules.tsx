"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBasket } from "lucide-react";

import { ModuleTeaser } from "./ModuleTeaser";
import { setBringSectionEnabled } from "../actions";

type EventAvailableModulesProps = {
    eventId: string;
    slug: string;
    hasBringSection: boolean;
    isAdmin: boolean;
};

export function EventAvailableModules({
    eventId,
    slug,
    hasBringSection,
    isAdmin,
}: EventAvailableModulesProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    if (!isAdmin || hasBringSection) return null;

    return (
        <div className="mt-3 space-y-2">
            <ModuleTeaser
                Icon={ShoppingBasket}
                title="Qui ramène quoi ?"
                description="Ajoute une section pour suivre boissons, nourriture et matériel."
                onClick={() =>
                    startTransition(async () => {
                        await setBringSectionEnabled({ eventId, enabled: true, slug });
                        router.refresh();
                    })
                }
            />
        </div>
    );
}
