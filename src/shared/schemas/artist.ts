import { z } from "zod";
import { PROVIDER_IDS, ARTIST_TYPES } from "../constants";

/**
 * Add Artist Schema
 *
 * Single source of truth for AddArtist validation and typing.
 * Shared between Main and Renderer processes for type safety and validation.
 *
 * This schema validates incoming data from Renderer before saving to database.
 * Use this schema in Renderer for form validation before sending to Main process.
 *
 * This schema is the single source of truth for artist input format.
 * Both Main (validation) and Renderer (form validation) use this schema.
 */
export const AddArtistSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  tag: z.string().trim().min(1, "Tag cannot be empty"),
  provider: z.enum(PROVIDER_IDS),
  type: z.enum(ARTIST_TYPES),
  apiEndpoint: z.string().url().trim().optional(),
});

/**
 * Add Artist Request Type
 *
 * Exported directly from schema to ensure single source of truth.
 * Use this type in IPC layer (bridge.ts, renderer.d.ts) instead of duplicating interface.
 */
export type AddArtistRequest = z.infer<typeof AddArtistSchema>;
