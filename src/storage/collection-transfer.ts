import * as z from "zod/mini";

import { CollectionSchema, type Collection } from "./schema";

/**
 * Export file for one or several collections, so a collection can be shared
 * or moved without the whole backup.
 */

export const COLLECTIONS_FILE_FORMAT = "ruledesk-web-collections";
export const COLLECTIONS_FILE_VERSION = 1;
const FILE_PREFIX = "ruledesk-web-collections-";
const FILE_SUFFIX = ".json";
const JSON_INDENT = 2;

const CollectionsFileSchema = z.object({
  format: z.literal(COLLECTIONS_FILE_FORMAT),
  version: z.literal(COLLECTIONS_FILE_VERSION),
  collections: z.array(CollectionSchema),
});

export function collectionsFileName(dateStamp: string): string {
  return `${FILE_PREFIX}${dateStamp}${FILE_SUFFIX}`;
}

export function serializeCollections(collections: readonly Collection[]): string {
  return `${JSON.stringify(
    {
      format: COLLECTIONS_FILE_FORMAT,
      version: COLLECTIONS_FILE_VERSION,
      collections,
    },
    null,
    JSON_INDENT,
  )}\n`;
}

/** The collections of an export file, or null when the text is not one. */
export function parseCollectionsFile(text: string): Collection[] | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = CollectionsFileSchema.safeParse(raw);
  return parsed.success ? parsed.data.collections : null;
}
