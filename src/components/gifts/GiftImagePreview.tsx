"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type GiftImagePreviewProps = {
  src: string;
  alt: string;
  /** taille du thumbnail (ex: "h-24 w-24") */
  sizeClassName?: string;
};

export function GiftImagePreview({
  src,
  alt,
  sizeClassName = "h-24 w-24",
}: GiftImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`${sizeClassName} flex-shrink-0 overflow-hidden rounded-md border bg-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
          aria-label="Afficher l’image en grand"
        >
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none">
        {/* Titre requis pour l'accessibilité, mais visuellement caché */}
        <DialogHeader className="sr-only">
          <DialogTitle>{alt || "Aperçu du cadeau"}</DialogTitle>
        </DialogHeader>

        <div className="overflow-hidden rounded-2xl bg-background">
          <img
            src={src}
            alt={alt}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
