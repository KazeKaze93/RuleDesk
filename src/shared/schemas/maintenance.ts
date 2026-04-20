import { z } from "zod";

export const RepairArtistIdIpcSchema = z.tuple([z.number().int().positive()]);

export type RepairArtistIdIpcArgs = z.infer<typeof RepairArtistIdIpcSchema>;
