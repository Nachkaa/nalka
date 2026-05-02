"use client";

import { AlertCircle, Image as ImageIcon, Link2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

import FetchFromLink from "@/components/forms/FetchFromLink";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGiftItemAction,
  suggestGiftItemAction,
  updateGiftItemAction,
} from "@/features/gifts/actions";
import {
  getGiftImageFile,
  GIFT_IMAGE_TOO_LARGE_MESSAGE,
  MAX_GIFT_IMAGE_SIZE_LABEL,
  validateGiftImageFileSize,
} from "@/features/gifts/lib/image-upload";
import { getExternalGiftImageUrlValue, getGiftImageSourceKind } from "@/features/gifts/lib/image-source";

type GiftIdeaDialogProps = {
  mode: "create" | "edit" | "suggest";
  eventId: string;
  slug: string;
  itemId?: string;
  targetListId?: string;
  targetDisplayName?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValues?: {
    title?: string;
    url?: string | null;
    note?: string | null;
    imagePath?: string | null;
  };
  reservationWarning?: string | null;
};

type ImageMode = "url" | "upload";

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function getInitialImageMode(imagePath: string | null | undefined): ImageMode {
  return getGiftImageSourceKind(imagePath) === "uploaded_or_stored" ? "upload" : "url";
}

function getPreviewCaption(preview: string) {
  if (preview.startsWith("blob:")) {
    return "Nouvelle image importee.";
  }

  return getGiftImageSourceKind(preview) === "external_url"
    ? "Image depuis une URL."
    : "Image actuelle enregistree.";
}

export function GiftIdeaDialog({
  mode,
  eventId,
  slug,
  itemId,
  targetListId,
  targetDisplayName,
  trigger,
  open,
  onOpenChange,
  defaultValues,
  reservationWarning,
}: GiftIdeaDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialImage = defaultValues?.imagePath ?? null;
  const initialImageSource = getGiftImageSourceKind(initialImage);
  const [imageMode, setImageMode] = useState<ImageMode>(() => getInitialImageMode(initialImage));
  const [imageUrlValue, setImageUrlValue] = useState(() => getExternalGiftImageUrlValue(initialImage));
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;

  const titleId = useId();
  const urlId = useMemo(() => `gift-url-${mode}-${itemId ?? "new"}`, [mode, itemId]);
  const noteId = useMemo(() => `gift-note-${mode}-${itemId ?? "new"}`, [mode, itemId]);
  const imageUrlId = useMemo(() => `gift-image-url-${mode}-${itemId ?? "new"}`, [mode, itemId]);
  const fileId = useMemo(() => `gift-image-file-${mode}-${itemId ?? "new"}`, [mode, itemId]);

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setError(null);
      setFileError(null);
    }
  };

  useEffect(() => {
    if (!resolvedOpen) return;

    setError(null);
    setFileError(null);
    setRemoveImage(false);
    setPreview(defaultValues?.imagePath ?? null);
    setImageMode(getInitialImageMode(defaultValues?.imagePath ?? null));
    setImageUrlValue(getExternalGiftImageUrlValue(defaultValues?.imagePath));

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [defaultValues?.imagePath, resolvedOpen]);

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
      setFileError(null);
      return;
    }

    const fileErrorMessage = validateGiftImageFileSize(file);
    if (fileErrorMessage) {
      setFileError(fileErrorMessage);
      event.target.value = "";
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

  const clearImage = () => {
    if (preview && preview !== initialImage && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setImageUrlValue("");
    setRemoveImage(true);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPreviewFromUrl = (value: string | null) => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setImageUrlValue(value ?? "");
    setRemoveImage(false);
    setFileError(null);
    setPreview(value || (initialImageSource === "uploaded_or_stored" ? initialImage : null));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) {
      setError("Le titre est requis.");
      return;
    }

    formData.set("title", title);
    formData.set("url", String(formData.get("url") ?? "").trim());
    formData.set("note", String(formData.get("note") ?? "").trim());

    const fileErrorMessage = validateGiftImageFileSize(getGiftImageFile(formData));
    if (fileErrorMessage) {
      setFileError(fileErrorMessage);
      setError(GIFT_IMAGE_TOO_LARGE_MESSAGE);
      return;
    }

    if (imageMode === "url") {
      formData.delete("image");
      formData.set("imageUrl", imageUrlValue.trim());
    } else {
      formData.set("imageUrl", "");
    }

    formData.set("removeImage", removeImage ? "1" : "");

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createGiftItemAction({ eventId, slug, formData });
        } else if (mode === "edit") {
          if (!itemId) throw new Error("Aucun cadeau a modifier.");
          await updateGiftItemAction({ eventId, slug, itemId, formData });
        } else {
          if (!targetListId) throw new Error("Liste cible manquante pour la suggestion.");
          await suggestGiftItemAction({ eventId, slug, targetListId, formData });
        }

        handleOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'idee.");
      }
    });
  };

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Ajouter une idee"
              : mode === "edit"
                ? "Modifier l'idee"
                : `Suggérer une idee${targetDisplayName ? ` a ${targetDisplayName}` : ""}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "suggest"
              ? "Tu proposes une idee : elle apparait comme suggestion dans la liste du participant."
              : "Mets un titre clair. Ajoute un lien pour faciliter l'achat, et un commentaire si besoin."}
          </DialogDescription>
        </DialogHeader>

        {reservationWarning ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{reservationWarning}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          <input type="hidden" name="removeImage" value={removeImage ? "1" : ""} readOnly />

          <div className="space-y-2">
            <Label htmlFor={titleId}>
              Nom de l&apos;idee <span className="text-red-600">*</span>
            </Label>
            <Input
              id={titleId}
              name="title"
              required
              maxLength={120}
              defaultValue={defaultValues?.title ?? ""}
              placeholder="Ex. Casque audio sans fil"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={urlId}>Lien (optionnel)</Label>
              <FetchFromLink
                urlInputId={urlId}
                titleInputId={titleId}
                noteInputId={noteId}
                imageInputId={imageUrlId}
                onImageUrlChange={(nextUrl) => {
                  setImageMode("url");
                  setPreviewFromUrl(nextUrl);
                }}
              />
            </div>

            <Input
              id={urlId}
              name="url"
              inputMode="url"
              type="url"
              placeholder="https://exemple.com/produit"
              defaultValue={defaultValues?.url ?? ""}
            />
            <p className="text-muted-foreground text-xs">
              Colle un lien. Tu peux utiliser l&apos;auto-remplissage si disponible.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Image (optionnel)</Label>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={imageMode === "url" ? "default" : "outline"}
                className="w-full justify-center"
                onClick={() => {
                  setImageMode("url");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setError(null);
                  setFileError(null);
                  if (preview?.startsWith("blob:")) {
                    setPreviewFromUrl(imageUrlValue || null);
                  }
                }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Depuis une URL
              </Button>

              <Button
                type="button"
                variant={imageMode === "upload" ? "default" : "outline"}
                className="w-full justify-center"
                onClick={() => {
                  setImageMode("upload");
                  setError(null);
                  setFileError(null);
                  if (!preview && !removeImage) {
                    setPreview(initialImage);
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </div>

            {imageMode === "url" ? (
              <div className="space-y-2">
                <Input
                  id={imageUrlId}
                  name="imageUrl"
                  inputMode="url"
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={imageUrlValue}
                  onChange={(event) => setPreviewFromUrl(event.target.value || null)}
                />
                <p className="text-muted-foreground text-xs">
                  Colle un lien direct d&apos;image, ou laisse vide.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  id={fileId}
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
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Une seule image, max {MAX_GIFT_IMAGE_SIZE_LABEL}.
                  </p>
                )}
              </div>
            )}

            {preview ? (
              <div className="flex items-center gap-3">
                <div className="bg-muted relative h-20 w-20 overflow-hidden rounded-lg border">
                  {isHttpUrl(preview) ? (
                    <Image
                      src={preview}
                      alt="Apercu de l'image"
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Image
                      src={preview}
                      alt="Apercu de l'image"
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized={preview.startsWith("blob:")}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">Apercu</p>
                  <p className="text-muted-foreground text-xs">{getPreviewCaption(preview)}</p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  aria-label="Retirer l'image"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="text-muted-foreground inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
                <ImageIcon className="h-4 w-4" aria-hidden="true" /> Aucune image
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={noteId}>Commentaire (optionnel)</Label>
            <Textarea
              id={noteId}
              name="note"
              rows={3}
              maxLength={500}
              defaultValue={defaultValues?.note ?? ""}
              placeholder="Couleur, taille, variante..."
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : mode === "create" ? "Ajouter" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
