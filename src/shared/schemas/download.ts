import { z } from "zod";
import { IdSchema } from "./ipc";
import { PostFilterSchema } from "./post";

const MAX_FILENAME_LENGTH = 200;

export const DownloadAllItemSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
      message: "Only HTTP/HTTPS protocols are allowed for downloads.",
    }),
  filename: z
    .string()
    .min(1)
    .max(MAX_FILENAME_LENGTH, `Filename must not exceed ${MAX_FILENAME_LENGTH} characters`)
    .regex(/^[\w\-. ]+$/, "Invalid filename characters"),
});

export const DownloadAllArtistRequestSchema = z.object({
  kind: z.literal("artist"),
  artistId: IdSchema,
  filters: PostFilterSchema.optional(),
});

export const DownloadAllFavoritesRequestSchema = z.object({
  kind: z.literal("favorites"),
  filters: PostFilterSchema.optional(),
});

/**
 * No .max() on items — oversize must return a typed DownloadAllResult from the
 * controller, not a Zod ValidationError across IPC.
 */
export const DownloadAllListRequestSchema = z.object({
  kind: z.literal("list"),
  items: z.array(DownloadAllItemSchema),
});

/** Discriminated union for mass-download IPC entry. */
export const DownloadAllRequestSchema = z.discriminatedUnion("kind", [
  DownloadAllArtistRequestSchema,
  DownloadAllFavoritesRequestSchema,
  DownloadAllListRequestSchema,
]);

export type DownloadAllRequest = z.infer<typeof DownloadAllRequestSchema>;
export type DownloadAllItem = z.infer<typeof DownloadAllItemSchema>;

/**
 * Result of opening the mass-download root via `shell.openPath`
 * (error is a string in the envelope, not thrown across IPC).
 */
export const OpenDownloadFolderResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({
    ok: z.literal(false),
    error: z.string().min(1),
  }),
]);

export type OpenDownloadFolderResult = z.infer<
  typeof OpenDownloadFolderResultSchema
>;

/**
 * Resolved mass-download root (`getDownloadRoot`) plus whether settings
 * still use the built-in default, and whether an inaccessible saved folder
 * forced a silent fallback to the default path.
 */
export const GetDownloadFolderResultSchema = z.object({
  path: z.string().min(1),
  configuredPath: z.string().min(1).nullable(),
  isDefault: z.boolean(),
  usingFallback: z.boolean(),
});

export type GetDownloadFolderResult = z.infer<
  typeof GetDownloadFolderResultSchema
>;
