"use client";

import { Button } from "@/components/ui/button";
import { createInviteToken } from "@/features/events/actions/invite";
import { Loader2, Share2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

type Props = {
  eventRef: string;
  title?: string | null;
};

export function InviteLinkButton({ eventRef, title }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleShare = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await createInviteToken(eventRef);
        const shareUrl = result.url;
        const shareTitle = title ?? "Invitation à l'événement";

        const hasNavigator = typeof navigator !== "undefined";
        const canClipboard = hasNavigator && !!navigator.clipboard?.writeText;
        const canShare = hasNavigator && typeof navigator.share === "function";

        // Always copy first to meet the UX requirement, even if share is available.
        if (canClipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Lien copié");
        }

        if (canShare) {
          try {
            await navigator.share({ title: shareTitle, url: shareUrl });
            return;
          } catch (err) {
            // Ignore aborted share, fallback to copy already done.
            if ((err as { name?: string })?.name === "AbortError") return;
          }
        }

        if (!canClipboard) {
          // Fallback copy for environments without navigator.clipboard.
          const textarea = document.createElement("textarea");
          textarea.value = shareUrl;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          toast.success("Lien copié");
        }
      } catch (error) {
        console.error(error);
        toast.error("Impossible de partager le lien");
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="soft"
      className="/* mobile: icon-only */ /* desktop: normal */ h-9 w-9 rounded-lg p-0 sm:w-auto sm:px-3 sm:py-2"
      title="Partager l’événement"
      aria-label="Partager l’événement"
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
  );
}
