import { rename, writeFile } from "node:fs/promises";
import { z } from "zod";
import { DownloadAllItemSchema } from "../../shared/schemas/download";
import { PostFilterSchema } from "../../shared/schemas/post";
import type {
  DownloadQueueFileV2,
  DownloadQueueFileV3,
  DownloadQueueFileV3Artist,
  DownloadQueueFileV3List,
  DownloadQueueItem,
} from "../../shared/types/download";

const QueueItemArraySchema = z.array(DownloadAllItemSchema);

const V3ArtistSchema = z.object({
  version: z.literal(3),
  kind: z.literal("artist"),
  artistId: z.number().int().positive(),
  filters: PostFilterSchema.optional(),
  cursorId: z.number().int().nonnegative(),
  upperBoundId: z.number().int().nonnegative(),
  chunkCompletedIds: z.array(z.string()),
  doneCount: z.number().int().nonnegative(),
  folder: z.string(),
  total: z.number().int().nonnegative(),
  timestamp: z.number(),
});

const V3ListSchema = z.object({
  version: z.literal(3),
  kind: z.literal("list"),
  items: QueueItemArraySchema,
  completedIds: z.array(z.string()),
  folder: z.string(),
  total: z.number().int().nonnegative(),
  timestamp: z.number(),
});

export type ParsedDownloadQueue =
  | { format: "v3"; data: DownloadQueueFileV3 }
  | { format: "v2-as-list"; data: DownloadQueueFileV3List };

/**
 * Parse queue JSON. V2 is migrated to V3 list. Invalid → null (caller logs + drops).
 */
export function parseDownloadQueueFile(raw: unknown): ParsedDownloadQueue | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  if ("version" in raw && raw.version === 3) {
    if ("kind" in raw && raw.kind === "artist") {
      const parsed = V3ArtistSchema.safeParse(raw);
      if (!parsed.success) {
        return null;
      }
      return { format: "v3", data: parsed.data };
    }
    if ("kind" in raw && raw.kind === "list") {
      const parsed = V3ListSchema.safeParse(raw);
      if (!parsed.success) {
        return null;
      }
      return { format: "v3", data: parsed.data };
    }
    return null;
  }

  // V2 or legacy doneCount → V3 list
  if (!("items" in raw) || !Array.isArray(raw.items)) {
    return null;
  }
  const itemsParse = QueueItemArraySchema.safeParse(raw.items);
  if (!itemsParse.success) {
    return null;
  }
  const folder =
    "folder" in raw && typeof raw.folder === "string" ? raw.folder : "";
  const timestamp =
    "timestamp" in raw && typeof raw.timestamp === "number" ? raw.timestamp : 0;
  const total =
    "total" in raw && typeof raw.total === "number"
      ? raw.total
      : itemsParse.data.length;

  let completedIds: string[] = [];
  if (
    "completedIds" in raw &&
    Array.isArray(raw.completedIds) &&
    raw.completedIds.every((id) => typeof id === "string")
  ) {
    completedIds = raw.completedIds;
  } else if ("doneCount" in raw && typeof raw.doneCount === "number") {
    completedIds = itemsParse.data
      .slice(0, Math.max(0, raw.doneCount))
      .map((item) => item.filename);
  } else {
    return null;
  }

  const list: DownloadQueueFileV3List = {
    version: 3,
    kind: "list",
    items: itemsParse.data,
    completedIds,
    total,
    folder,
    timestamp,
  };
  return { format: "v2-as-list", data: list };
}

/** Atomic write: tmp beside target then rename. */
export async function writeDownloadQueueAtomic(
  filePath: string,
  data: DownloadQueueFileV3 | DownloadQueueFileV2
): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data), "utf-8");
  await rename(tmpPath, filePath);
}

export function artistQueueInitial(params: {
  artistId: number;
  filters: DownloadQueueFileV3Artist["filters"];
  upperBoundId: number;
  total: number;
  folder: string;
}): DownloadQueueFileV3Artist {
  return {
    version: 3,
    kind: "artist",
    artistId: params.artistId,
    filters: params.filters,
    cursorId: 0,
    upperBoundId: params.upperBoundId,
    chunkCompletedIds: [],
    doneCount: 0,
    folder: params.folder,
    total: params.total,
    timestamp: Date.now(),
  };
}

export function listQueueInitial(params: {
  items: DownloadQueueItem[];
  folder: string;
}): DownloadQueueFileV3List {
  return {
    version: 3,
    kind: "list",
    items: params.items,
    completedIds: [],
    total: params.items.length,
    folder: params.folder,
    timestamp: Date.now(),
  };
}
