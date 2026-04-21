import { z } from "zod";

export const CURRENT_SMART_QUERY_SCHEMA_VERSION = 1;

export const SmartQueryTagSchema = z.object({
  tag: z.string().min(1, "Tag cannot be empty"),
  type: z.enum(["include", "exclude"]),
});

// v1: current smart-playlist DSL in production
export const SmartQueryV1Schema = z.object({
  tags: z.array(SmartQueryTagSchema).min(1, "At least one tag is required"),
  provider: z.enum(["rule34", "gelbooru"]).optional().default("rule34"),
});

export type SmartQueryV1 = z.infer<typeof SmartQueryV1Schema>;

export function parseSmartQuery(
  json: string | null | undefined,
  version: number
): SmartQueryV1 | null {
  if (!json || json.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(json);
    if (version === 1) {
      return SmartQueryV1Schema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}
