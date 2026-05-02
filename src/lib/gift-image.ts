// src/lib/gift-image.ts
import { nanoid } from "nanoid";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  GIFT_IMAGE_TOO_LARGE_MESSAGE,
  MAX_GIFT_IMAGE_SIZE_BYTES,
} from "@/features/gifts/lib/image-upload";

const OUTPUT_SIZE = 600; // carré 600x600

export async function processGiftImage(file: File | null | undefined): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Format de fichier non supporté");
  }
  if (file.size > MAX_GIFT_IMAGE_SIZE_BYTES) {
    throw new Error(GIFT_IMAGE_TOO_LARGE_MESSAGE);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const img = sharp(buffer).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Image invalide");
  }

  const size = Math.min(meta.width, meta.height, OUTPUT_SIZE);

  const out = await img
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `gift-images/${nanoid(16)}.webp`;
  const fullPath = path.join(process.cwd(), "public", key);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, out);

  return `/${key}`;
}