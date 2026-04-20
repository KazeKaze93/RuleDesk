import { z } from "zod";

/** Most filesystems limit filenames to 255 chars; leave margin for path and extension. */
export const MAX_FILENAME_LENGTH = 200;

export const BATCH_DOWNLOAD_MAX_FILES = 500;

export const DownloadFileSchema = z.object({
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

export type DownloadFileRequest = z.infer<typeof DownloadFileSchema>;

export const OpenFolderSchema = z.string().min(1);

export type OpenFolderArg = z.infer<typeof OpenFolderSchema>;

export const DownloadAllItemSchema = z.object({
  url: DownloadFileSchema.shape.url,
  filename: DownloadFileSchema.shape.filename,
});

export const DownloadAllSchema = z
  .array(DownloadAllItemSchema)
  .max(BATCH_DOWNLOAD_MAX_FILES);

export type DownloadAllRequest = z.infer<typeof DownloadAllSchema>;

export const DownloadFileIpcSchema = z.tuple([
  DownloadFileSchema.shape.url,
  DownloadFileSchema.shape.filename,
]);
