// FILE: src/components/gifts/GiftImagePreview.tsx
"use client";

import Image from "next/image";
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

export function GiftImagePreview({ src, alt, sizeClassName = "h-24 w-24" }: GiftImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`${sizeClassName} bg-muted relative flex-shrink-0 overflow-hidden rounded-md border focus:ring-2 focus:ring-[var(--primary)] focus:outline-none`}
          aria-label="Afficher l’image en grand"
        >
          <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-none bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{alt || "Aperçu du cadeau"}</DialogTitle>
        </DialogHeader>

        <div className="bg-background overflow-hidden rounded-2xl">
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1200}
            sizes="(max-width: 768px) 92vw, 768px"
            className="max-h-[80vh] w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
