// src/lib/event-image.ts
import { nanoid } from "nanoid";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 Mo
const OUTPUT_SIZE = 800; // 800x800 carré

export async function processEventImage(file: File | null | undefined): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Format de fichier non supporté");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image trop lourde (max 3 Mo)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let img = sharp(buffer).rotate(); // auto-rotate selon EXIF
  const meta = await img.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Image invalide");
  }

  const size = Math.min(meta.width, meta.height, OUTPUT_SIZE);

  const out = await img
    .resize(size, size, { fit: "cover" }) // crop carré centré
    .webp({ quality: 80 })
    .toBuffer();

  const key = `event-images/${nanoid(16)}.webp`;
  const fullPath = path.join(process.cwd(), "public", key);

  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, out);

  // Chemin public à utiliser dans <img src="...">
  return `/${key}`;
}
