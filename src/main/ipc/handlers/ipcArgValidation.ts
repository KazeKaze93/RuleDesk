import { z } from "zod";

const EMPTY_ARGS_SCHEMA = z.tuple([]);

export function parseNoArgs(args: unknown[]): void {
  const parsed = EMPTY_ARGS_SCHEMA.safeParse(args);
  if (!parsed.success) {
    throw new Error("Invalid arguments");
  }
}

export function parseSingleArg<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  args: unknown[]
): z.infer<TSchema> {
  const tupleSchema = z.tuple([schema]);
  const parsed = tupleSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("Invalid arguments");
  }
  return parsed.data[0];
}
