"use server";

import "server-only";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(120),
  description: z.string().trim().max(500).optional(),
  eventOn: z.string().trim().min(1, "Date requise"), // ISO date or datetime-local
  location: z.string().trim().max(120).optional(),
});