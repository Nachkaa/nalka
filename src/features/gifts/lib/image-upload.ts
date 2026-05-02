export const MAX_GIFT_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
export const MAX_GIFT_IMAGE_SIZE_LABEL = "3 Mo";
export const GIFT_IMAGE_TOO_LARGE_MESSAGE = `Image trop lourde (max ${MAX_GIFT_IMAGE_SIZE_LABEL}).`;

export function getGiftImageFile(formData: FormData) {
  const candidate = formData.get("image");
  return candidate instanceof File ? candidate : null;
}

export function validateGiftImageFileSize(file: File | null | undefined) {
  if (!file || file.size === 0) {
    return null;
  }

  if (file.size > MAX_GIFT_IMAGE_SIZE_BYTES) {
    return GIFT_IMAGE_TOO_LARGE_MESSAGE;
  }

  return null;
}
