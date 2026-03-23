"use client";

import { Button } from "@/components/ui/button";
import { createInviteToken } from "@/features/events/actions/invite";
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

  const copyToClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleShare = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await createInviteToken(slug);
        const shareUrl = result.url;
        const shareTitle = title ?? "Evenement";
        const canShare = typeof navigator.share === "function";

        await copyToClipboard(shareUrl);
        toast.success("Lien d'invitation copie");

        if (canShare) {
          try {
            await navigator.share({ title: shareTitle, url: shareUrl });
            return;
          } catch (err) {
            if ((err as { name?: string })?.name === "AbortError") return;
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Impossible de partager le lien d'invitation");
      }
    });
  };

  const handleCopyDirectLink = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        await copyToClipboard(`${window.location.origin}/event/${slug}`);
        toast.success("Lien direct copie");
      } catch (error) {
        console.error(error);
        toast.error("Impossible de copier le lien direct");
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
