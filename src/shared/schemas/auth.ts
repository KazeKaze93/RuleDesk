import { z } from "zod";
import { PROVIDER_IDS } from "../constants";

export const VerifyCredentialsIpcSchema = z.tuple([
  z.enum(PROVIDER_IDS).optional(),
]);

export type VerifyCredentialsIpcArgs = z.infer<typeof VerifyCredentialsIpcSchema>;
