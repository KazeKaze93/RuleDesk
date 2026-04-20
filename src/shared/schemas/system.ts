import { z } from "zod";

export const WriteClipboardIpcSchema = z.tuple([z.string().min(1)]);

export type WriteClipboardIpcArgs = z.infer<typeof WriteClipboardIpcSchema>;
