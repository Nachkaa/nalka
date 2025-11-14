"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/forms/SubmitButton";
import FieldCharCount from "@/components/forms/FieldCharCount";
import FetchFromLink from "@/components/forms/FetchFromLink";

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

export function GiftForm({
  action,
  defaultValues,
  submitLabel,
  footerClassName,
}: GiftFormProps) {
  const title = defaultValues?.title ?? "";
  const url = defaultValues?.url ?? "";
  const note = defaultValues?.note ?? "";

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(
    defaultValues?.imagePath ?? null,
  );
  const initialImage = defaultValues?.imagePath ?? null;

  useEffect(() => {
    return () => {
      if (preview && preview !== initialImage && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, initialImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(initialImage);
      return;
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // côté serveur : si preview=null ET pas de fichier, tu peux décider de conserver l’ancienne image
  };

  

  return (
    <form action={action} className="space-y-6">
        <input
          id="imageUrl"
          name="imageUrl"
          type="hidden"
          defaultValue={defaultValues?.imagePath ?? ""}
        />
      <div className="space-y-2">
        <Label htmlFor="title">
          Nom <span className="text-red-600">*</span>
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
            onImageUrlChange={(url) => {  
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              setPreview(url);
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
        <p className="text-xs text-muted-foreground">
          Collez un lien. On complètera le nom et le commentaire si possible.
        </p>
      </div>

      {/* Image + preview */}
      <div className="space-y-2">
        <Label htmlFor="image">Image du cadeau</Label>

        {preview && (
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            <img
              src={preview}
              alt={title ? `Image du cadeau ${title}` : "Image du cadeau"}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={handleClearImage}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[var(--primary-foreground)] shadow focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              aria-label="Retirer l’image"
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
        <p className="text-xs text-muted-foreground">
          Une seule image, max 3 Mo. Recadrée automatiquement en carré dans la liste.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Commentaire</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Ex. couleur, taille, variante…"
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
