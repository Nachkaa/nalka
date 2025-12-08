"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleTeaserProps = {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    onClick: () => void | Promise<void>;
};

export function ModuleTeaser({ Icon, title, description, onClick }: ModuleTeaserProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between gap-3",
                "rounded-full border bg-[var(--secondary)]/60 px-3 py-2",
                "text-sm"
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-[var(--foreground)]/80" aria-hidden="true" />
                <div className="flex flex-col leading-tight">
                    <span className="font-medium truncate">{title}</span>
                    <span className="hidden sm:block text-[10px] text-muted-foreground truncate">
                        {description}
                    </span>
                </div>
            </div>

            <Button
                size="sm"
                className="h-7 px-3 text-xs rounded-full"
                onClick={() => void onClick()}
            >
                Activer
            </Button>
        </div>
    );
}
