import { z } from "zod";

// --- 1. Artist Schema ---

export const artistBaseSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["tag", "uploader", "query"]),
  apiEndpoint: z.string().url(),
});

export type ArtistFormValues = z.infer<typeof artistBaseSchema>;

// --- 2. Creds Schema (Onboarding) ---

export const credsBaseSchema = z.object({
  userId: z.string().min(1),
  apiKey: z.string().min(5),
});

export type CredsFormValues = z.infer<typeof credsBaseSchema>;
