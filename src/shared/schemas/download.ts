import { z } from "zod";
import { IdSchema } from "./ipc";
import { PostFilterSchema } from "./post";
import { BATCH_DOWNLOAD_LIST_MAX_FILES } from "../constants";

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

export const DownloadAllListRequestSchema = z.object({
  kind: z.literal("list"),
  items: z.array(DownloadAllItemSchema).max(BATCH_DOWNLOAD_LIST_MAX_FILES),
});

/** Discriminated union for mass-download IPC entry. */
export const DownloadAllRequestSchema = z.discriminatedUnion("kind", [
  DownloadAllArtistRequestSchema,
  DownloadAllListRequestSchema,
]);

export type DownloadAllRequest = z.infer<typeof DownloadAllRequestSchema>;
export type DownloadAllItem = z.infer<typeof DownloadAllItemSchema>;
