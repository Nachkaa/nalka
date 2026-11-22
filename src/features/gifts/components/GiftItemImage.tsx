"use client";

import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
};

function isRemoteImageUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function GiftItemImage({ src, alt }: Props) {
  const [hasError, setHasError] = useState(false);
  const isLocalImage = !!src && src.startsWith("/") && !src.startsWith("//");

  if (!src || hasError || (!isLocalImage && !isRemoteImageUrl(src))) {
    return (
      <div
        role="img"
        aria-label={`Aucune image disponible pour ${alt}`}
        className="from-primary/15 to-primary/5 absolute inset-0 grid place-items-center bg-gradient-to-br"
      >
        <ImageIcon aria-hidden="true" className="text-primary/50 h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white">
      {isLocalImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          onError={() => setHasError(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
