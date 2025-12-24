import { z } from "zod";

export const credsBaseSchema = z.object({
  userId: z.string().min(1),
  apiKey: z.string().min(5),
});

export type CredsFormValues = z.infer<typeof credsBaseSchema>;
