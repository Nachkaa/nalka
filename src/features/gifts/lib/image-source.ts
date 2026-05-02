export type GiftImageSourceKind = "none" | "external_url" | "uploaded_or_stored";

export function getGiftImageSourceKind(
  imagePath: string | null | undefined,
): GiftImageSourceKind {
  if (!imagePath) {
    return "none";
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return "external_url";
  }

  return "uploaded_or_stored";
}

export function getExternalGiftImageUrlValue(imagePath: string | null | undefined) {
  return getGiftImageSourceKind(imagePath) === "external_url" ? imagePath ?? "" : "";
}
