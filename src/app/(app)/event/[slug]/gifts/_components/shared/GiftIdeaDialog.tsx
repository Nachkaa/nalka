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

import { createGiftItem, suggestGiftItem, updateGiftItem } from "../../actions";

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

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 Mo
type ImageMode = "url" | "upload";

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v);
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

  // image state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialImage = defaultValues?.imagePath ?? null;
  const [imageMode, setImageMode] = useState<ImageMode>(() => (initialImage ? "url" : "url"));
  const [preview, setPreview] = useState<string | null>(initialImage);
  const [fileError, setFileError] = useState<string | null>(null);

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

  // reset on open
  useEffect(() => {
    if (!resolvedOpen) return;

    setError(null);
    setFileError(null);

    const img = defaultValues?.imagePath ?? null;
    setPreview(img);
    setImageMode("url");

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resolvedOpen, defaultValues?.imagePath]);

  // cleanup blob preview
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
      // fallback to current url preview if any
      setFileError(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("Image trop lourde (max 3 Mo).");
      e.target.value = "";
      return;
    }

    setFileError(null);

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
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPreviewFromUrl = (url: string | null) => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFileError(null);
    setPreview(url);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") ?? "").trim();
    if (!title) {
      setError("Le titre est requis.");
      return;
    }
    formData.set("title", title);

    const url = String(formData.get("url") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    formData.set("url", url);
    formData.set("note", note);

    if (imageMode === "url") {
      formData.delete("image");
      const imageUrl = String(formData.get("imageUrl") ?? "").trim();
      formData.set("imageUrl", imageUrl);
    } else {
      formData.set("imageUrl", "");
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createGiftItem(eventId, slug, formData);
        } else if (mode === "edit") {
          if (!itemId) throw new Error("Aucun cadeau à modifier.");
          await updateGiftItem(eventId, slug, itemId, formData);
        } else {
          if (!targetListId) throw new Error("Liste cible manquante pour la suggestion.");
          await suggestGiftItem(eventId, slug, targetListId, formData);
        }

        handleOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible d'enregistrer l’idée.");
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
              ? "Ajouter une idée"
              : mode === "edit"
                ? "Modifier l’idée"
                : `Suggérer une idée${targetDisplayName ? ` à ${targetDisplayName}` : ""}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "suggest"
              ? "Tu proposes une idée : elle apparaît comme suggestion dans la liste du participant."
              : "Mets un titre clair. Ajoute un lien pour faciliter l’achat, et un commentaire si besoin."}
          </DialogDescription>
        </DialogHeader>

        {reservationWarning ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{reservationWarning}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor={titleId}>
              Nom de l’idée <span className="text-red-600">*</span>
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

          {/* URL + Fetch */}
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
              Colle un lien. Tu peux utiliser l’auto-remplissage si disponible.
            </p>
          </div>

          {/* Image picker (URL vs Upload) */}
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
                  setFileError(null);
                  // if current preview is blob, clear it (avoid confusion)
                  if (preview?.startsWith("blob:"))
                    setPreviewFromUrl(
                      String(
                        (document.getElementById(imageUrlId) as HTMLInputElement | null)?.value ??
                          "",
                      ) || null,
                    );
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
                  // clear url input to avoid ambiguity
                  const input = document.getElementById(imageUrlId) as HTMLInputElement | null;
                  if (input) input.value = "";
                  setPreview(null);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer
              </Button>
            </div>

            {/* URL mode */}
            {imageMode === "url" ? (
              <div className="space-y-2">
                <Input
                  id={imageUrlId}
                  name="imageUrl"
                  inputMode="url"
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  defaultValue={defaultValues?.imagePath ?? ""}
                  onChange={(e) => setPreviewFromUrl(e.target.value ? e.target.value : null)}
                />
                <p className="text-muted-foreground text-xs">
                  Colle un lien direct d’image (ou laisse vide).
                </p>
              </div>
            ) : (
              /* Upload mode */
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
                  <p className="text-muted-foreground text-xs">Une seule image, max 3 Mo.</p>
                )}
              </div>
            )}

            {/* Preview */}
            {preview ? (
              <div className="flex items-center gap-3">
                <div className="bg-muted relative h-20 w-20 overflow-hidden rounded-lg border">
                  {isHttpUrl(preview) ? (
                    // server-safe (no handlers)
                    <img
                      src={preview}
                      alt="Aperçu de l’image"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Image
                      src={preview}
                      alt="Aperçu de l’image"
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized={preview.startsWith("blob:")}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">Aperçu</p>
                  <p className="text-muted-foreground text-xs">
                    {imageMode === "url" ? "Image depuis une URL." : "Image importée."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  aria-label="Retirer l’image"
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

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor={noteId}>Commentaire (optionnel)</Label>
            <Textarea
              id={noteId}
              name="note"
              rows={3}
              maxLength={500}
              defaultValue={defaultValues?.note ?? ""}
              placeholder="Couleur, taille, variante…"
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
              {isPending ? "Enregistrement…" : mode === "create" ? "Ajouter" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
