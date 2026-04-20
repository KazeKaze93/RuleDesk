import { z } from "zod";

/** Single-argument IPC schema for opening a URL in the system browser (validated again in Main for HTTPS / host allowlist). */
export const OpenExternalUrlSchema = z.string().url().min(1);

export type OpenExternalUrlArg = z.infer<typeof OpenExternalUrlSchema>;
