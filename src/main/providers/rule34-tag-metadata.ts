import axios from "axios";
import log from "electron-log";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { getProxyAgent } from "../lib/proxy";
import {
  TAG_RESOLVE_REQUEST_TIMEOUT_MS,
} from "../config/tag-resolve-constants";
import type { ProviderSettings } from "./types";
import type { ProviderThrottle } from "./provider-throttle";

const R34TagResponseSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().min(1),
    type: z.union([z.number(), z.string()]).transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
      if (Number.isNaN(num) || num < 0) {
        throw new z.ZodError([
          {
            code: "custom",
            path: ["type"],
            message: "Invalid type value",
          },
        ]);
      }
      return num;
    }),
  })
  .passthrough();

export type Rule34TagMetadataEntry = {
  name: string;
  type: number;
};

function isTagApiObject(
  value: unknown
): value is { name: string; type: string | number; id?: number } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("name" in value) || !("type" in value)) {
    return false;
  }
  const name = Reflect.get(value, "name");
  const type = Reflect.get(value, "type");
  return typeof name === "string" && type !== undefined;
}

export class Rule34TagRateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`Rule34 tag API rate limited (retry after ${retryAfterMs}ms)`);
    this.name = "Rule34TagRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

function parseTagXmlResponse(
  text: string,
  tagName: string
): Array<{ name: string; type: number; id?: number }> {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      trimValues: true,
    });

    const parsed = parser.parse(text);
    const tags = parsed.tags?.tag || parsed.tag || [];
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const items: Array<{ name: string; type: number; id?: number }> = [];
    const requestedTagLower = tagName.toLowerCase();

    for (const tag of tagArray) {
      if (!tag || typeof tag !== "object") {
        continue;
      }

      const name = Reflect.get(tag, "@_name") ?? Reflect.get(tag, "name");
      const type = Reflect.get(tag, "@_type") ?? Reflect.get(tag, "type");
      const id = Reflect.get(tag, "@_id") ?? Reflect.get(tag, "id");

      if (name !== undefined && type !== undefined) {
        const parsedName = String(name).trim();
        const parsedType =
          typeof type === "number" ? type : parseInt(String(type), 10);

        if (
          parsedName.toLowerCase() === requestedTagLower &&
          !Number.isNaN(parsedType)
        ) {
          items.push({
            id:
              id !== undefined
                ? typeof id === "number"
                  ? id
                  : parseInt(String(id), 10)
                : undefined,
            name: parsedName,
            type: parsedType,
          });
        }
      }
    }

    return items;
  } catch (error) {
    log.warn("[Rule34TagMetadata] Failed to parse tag XML response:", error);
    return [];
  }
}

function parseValidatedEntries(
  items: Array<{ name: string; type: string | number; id?: number }>,
  tagName: string
): Rule34TagMetadataEntry[] {
  const requestedTagLower = tagName.toLowerCase();
  const entries: Rule34TagMetadataEntry[] = [];

  for (const item of items) {
    const result = R34TagResponseSchema.safeParse(item);
    if (!result.success) {
      continue;
    }
    if (result.data.name.toLowerCase() !== requestedTagLower) {
      continue;
    }
    entries.push({
      name: result.data.name.toLowerCase().trim(),
      type: result.data.type,
    });
  }

  return entries;
}

export type Rule34TagMetadataLookupResult =
  | { status: "found"; entry: Rule34TagMetadataEntry }
  | { status: "not_found" };

export async function fetchRule34TagMetadata(
  tagName: string,
  settings: ProviderSettings,
  throttle: ProviderThrottle,
  headers: Record<string, string>
): Promise<Rule34TagMetadataLookupResult> {
  await throttle.wait();

  const params = new URLSearchParams({
    page: "dapi",
    s: "tag",
    q: "index",
    json: "1",
    // Single-tag lookup per Rule34 DAPI docs (see SearchController history: avoid undocumented `names`).
    name: tagName,
  });

  if (settings.apiKey) {
    params.append("api_key", settings.apiKey);
  }
  if (settings.userId) {
    params.append("user_id", String(settings.userId));
  }

  const url = `https://api.rule34.xxx/index.php?${params.toString()}`;

  const response = await axios.get<string>(url, {
    timeout: TAG_RESOLVE_REQUEST_TIMEOUT_MS,
    headers: {
      ...headers,
      "Accept-Encoding": "identity",
    },
    responseType: "text",
    validateStatus: (status) => status < 500,
    httpsAgent: getProxyAgent(),
  });

  if (response.status === 429) {
    const retryAfterHeader = response.headers["retry-after"];
    const retryAfterSeconds =
      typeof retryAfterHeader === "string"
        ? parseInt(retryAfterHeader, 10)
        : Number.NaN;
    const retryAfterMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : undefined;
    throw new Rule34TagRateLimitError(retryAfterMs ?? 0);
  }

  if (response.status < 200 || response.status >= 300) {
    log.warn(
      `[Rule34TagMetadata] Tag lookup HTTP ${response.status} for "${tagName}"`
    );
    throw new Error(`Rule34 tag lookup failed with HTTP ${response.status}`);
  }

  const text = response.data;
  let items: Array<{ name: string; type: string | number; id?: number }> = [];

  if (text.trim().startsWith("<")) {
    items = parseTagXmlResponse(text, tagName);
  } else {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      log.warn(
        `[Rule34TagMetadata] Failed to parse JSON for tag "${tagName}":`,
        parseErr
      );
      throw new Error("Rule34 tag lookup returned invalid JSON");
    }

    if (Array.isArray(data)) {
      items = data.filter(
        (item): item is { name: string; type: string | number; id?: number } =>
          typeof item === "object" && item !== null
      );
    } else if (isTagApiObject(data)) {
      items = [data];
    }
  }

  const entries = parseValidatedEntries(items, tagName);
  if (entries.length === 0) {
    return { status: "not_found" };
  }

  return { status: "found", entry: entries[0] };
}
