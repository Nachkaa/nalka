"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

type EventHeaderActionsProps = {
  slug: string;
  isAdmin: boolean;
  title?: string;
};

export function EventHeaderActions({ slug, isAdmin, title }: EventHeaderActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) return null;

  const handleShare = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const shareUrl = `${window.location.origin}/event/${slug}`;
        const shareTitle = title ?? "Evenement";

        const canClipboard = !!navigator.clipboard?.writeText;
        const canShare = typeof navigator.share === "function";

        if (canClipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Lien copie");
        }

        if (canShare) {
          try {
            await navigator.share({ title: shareTitle, url: shareUrl });
            return;
          } catch (err) {
            if ((err as { name?: string })?.name === "AbortError") return;
          }
        }

        if (!canClipboard) {
          const textarea = document.createElement("textarea");
          textarea.value = shareUrl;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          toast.success("Lien copie");
        }
      } catch (error) {
        console.error(error);
        toast.error("Impossible de partager le lien");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="soft"
        className="h-9 w-9 rounded-lg p-0 sm:w-auto sm:px-3 sm:py-2"
        title="Partager l'evenement"
        aria-label="Partager l'evenement"
        onClick={handleShare}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Share2 className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Partager</span>
      </Button>

      <Button
        asChild
        variant="soft"
        size="sm"
        className="h-9 w-9 rounded-lg p-0 sm:w-auto sm:px-3 sm:py-2"
        aria-label="Modifier l'evenement"
        title="Modifier l'evenement"
      >
        <Link
          href={`/event/${slug}/edit`}
          prefetch={false}
          className="inline-flex items-center justify-center gap-2"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Modifier</span>
        </Link>
      </Button>
    </div>
  );
}
