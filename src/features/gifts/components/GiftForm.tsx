"use client";

import FieldCharCount from "@/components/forms/FieldCharCount";
import FetchFromLink from "@/components/forms/FetchFromLink";
import SubmitButton from "@/components/forms/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getGiftImageFile,
  MAX_GIFT_IMAGE_SIZE_LABEL,
  validateGiftImageFileSize,
} from "@/features/gifts/lib/image-upload";
import { getExternalGiftImageUrlValue } from "@/features/gifts/lib/image-source";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GiftFormValues = {
  title?: string;
  url?: string | null;
  note?: string | null;
  imagePath?: string | null;
};

type GiftFormProps = {
  action: (formData: FormData) => Promise<void> | void;
  defaultValues?: GiftFormValues;
  submitLabel: string;
  footerClassName?: string;
};

export function GiftForm({ action, defaultValues, submitLabel, footerClassName }: GiftFormProps) {
  const title = defaultValues?.title ?? "";
  const url = defaultValues?.url ?? "";
  const note = defaultValues?.note ?? "";
  const initialImage = defaultValues?.imagePath ?? null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview !== initialImage && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, initialImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(initialImage);
      setFileError(null);
      setRemoveImage(false);
      return;
    }

    const fileErrorMessage = validateGiftImageFileSize(file);
    if (fileErrorMessage) {
      setFileError(fileErrorMessage);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (preview && preview !== initialImage && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      setPreview(initialImage);
      return;
    }

    setFileError(null);
    setRemoveImage(false);
    const objectUrl = URL.createObjectURL(file);
    if (preview && preview !== initialImage && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(objectUrl);
  };

  const handleClearImage = () => {
    if (preview && preview !== initialImage && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFileError(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const fileErrorMessage = validateGiftImageFileSize(getGiftImageFile(formData));

    if (fileErrorMessage) {
      event.preventDefault();
      setFileError(fileErrorMessage);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-6">
      <input
        id="imageUrl"
        name="imageUrl"
        type="hidden"
        value={removeImage ? "" : getExternalGiftImageUrlValue(defaultValues?.imagePath)}
        readOnly
      />
      <input type="hidden" name="removeImage" value={removeImage ? "1" : ""} readOnly />

      <div className="space-y-2">
        <Label htmlFor="title">
          Nom de l&apos;idee <span className="text-red-600">*</span>
        </Label>
        <Input id="title" name="title" required maxLength={120} defaultValue={title} />
        <div className="flex justify-end">
          <FieldCharCount forId="title" max={120} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="url">Lien</Label>
          <FetchFromLink
            urlInputId="url"
            titleInputId="title"
            noteInputId="note"
            imageInputId="imageUrl"
            onImageUrlChange={(nextUrl) => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              setFileError(null);
              setRemoveImage(false);
              setPreview(nextUrl);
            }}
          />
        </div>
        <Input
          id="url"
          name="url"
          inputMode="url"
          placeholder="https://exemple.com/produit"
          defaultValue={url ?? ""}
        />
        <p className="text-muted-foreground text-xs">
          Collez un lien. On completera le nom et le commentaire si possible.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>

        {preview && (
          <div className="bg-muted relative h-24 w-24 overflow-hidden rounded-lg border">
            {/^https?:\/\//i.test(preview) ? (
              <Image
                src={preview}
                alt={title ? `Image du cadeau ${title}` : "Image du cadeau"}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image
                src={preview}
                alt={title ? `Image du cadeau ${title}` : "Image du cadeau"}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={preview.startsWith("blob:")}
              />
            )}

            <button
              type="button"
              onClick={handleClearImage}
              className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[var(--primary-foreground)] shadow focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              aria-label="Retirer l'image"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}

        <Input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {fileError ? (
          <p className="text-xs text-red-600" role="alert" aria-live="polite">
            {fileError}
          </p>
        ) : null}

        <p className="text-muted-foreground text-xs">
          Une seule image, max {MAX_GIFT_IMAGE_SIZE_LABEL}. Recadree automatiquement en carre dans
          la liste.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Commentaire</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Ex. couleur, taille, variante..."
          defaultValue={note ?? ""}
        />
        <div className="flex justify-end">
          <FieldCharCount forId="note" max={500} />
        </div>
      </div>

      <div
        className={
          footerClassName ??
          "sticky bottom-0 -mx-6 mt-4 bg-[var(--background)]/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60"
        }
      >
        <SubmitButton className="w-full">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
