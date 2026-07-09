import {
  ProviderSearchErrorPayloadSchema,
  type ProviderErrorKind,
  type ProviderSearchErrorPayload,
} from "../../shared/schemas/provider-errors";
import {
  PROVIDER_SEARCH_ERROR_TITLES,
  PROVIDER_SEARCH_USER_MESSAGES,
  providerSearchErrorShowsRetry,
} from "../../shared/schemas/provider-errors";

const IPC_INVOKE_PREFIX = /^Error invoking remote method '[^']+':\s*/;

function readUnknownField(error: object, key: string): unknown {
  return Reflect.get(error, key);
}

function stripIpcMessagePrefix(message: string): string {
  return message.replace(IPC_INVOKE_PREFIX, "").trim();
}

export function parseProviderSearchErrorPayload(
  error: unknown
): ProviderSearchErrorPayload | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const directCandidate = {
    name: readUnknownField(error, "name"),
    message: readUnknownField(error, "message"),
    code: readUnknownField(error, "code"),
    providerKind: readUnknownField(error, "providerKind"),
    retryAfterMs: readUnknownField(error, "retryAfterMs"),
  };

  const direct = ProviderSearchErrorPayloadSchema.safeParse(directCandidate);
  if (direct.success) {
    return direct.data;
  }

  const messageField = readUnknownField(error, "message");
  if (typeof messageField === "string") {
    const stripped = stripIpcMessagePrefix(messageField);
    const nested = ProviderSearchErrorPayloadSchema.safeParse({
      ...directCandidate,
      message: stripped,
    });
    if (nested.success) {
      return nested.data;
    }
  }

  return null;
}

export class BrowseSearchError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;
  readonly code: ProviderSearchErrorPayload["code"];

  constructor(payload: ProviderSearchErrorPayload) {
    super(payload.message);
    this.name = "BrowseSearchError";
    this.kind = payload.providerKind;
    this.retryAfterMs = payload.retryAfterMs;
    this.code = payload.code;
  }
}

export function toBrowseSearchError(error: unknown): BrowseSearchError | null {
  const payload = parseProviderSearchErrorPayload(error);
  if (!payload) {
    return null;
  }
  return new BrowseSearchError(payload);
}

export function assertBrowseSearchError(error: unknown): never {
  const typed = toBrowseSearchError(error);
  if (typed) {
    throw typed;
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(String(error));
}

export type BrowseSearchErrorPresentation = {
  title: string;
  description: string;
  showRetry: boolean;
};

export function getBrowseSearchErrorPresentation(
  kind: ProviderErrorKind
): BrowseSearchErrorPresentation {
  return {
    title: PROVIDER_SEARCH_ERROR_TITLES[kind],
    description: PROVIDER_SEARCH_USER_MESSAGES[kind],
    showRetry: providerSearchErrorShowsRetry(kind),
  };
}

export function getBrowseSearchRetryDelayMs(
  attempt: number,
  error: unknown
): number {
  const payload = parseProviderSearchErrorPayload(error);
  if (payload?.providerKind === "rate_limit" && payload.retryAfterMs) {
    return payload.retryAfterMs;
  }
  const baseMs = 1000;
  const maxMs = 30_000;
  return Math.min(baseMs * 2 ** attempt, maxMs);
}

export function shouldRetryBrowseSearch(
  failureCount: number,
  error: unknown
): boolean {
  const payload = parseProviderSearchErrorPayload(error);
  if (!payload) {
    return failureCount < 2;
  }
  if (payload.providerKind === "auth") {
    return false;
  }
  if (payload.providerKind === "rate_limit") {
    return false;
  }
  if (payload.providerKind === "parse") {
    return false;
  }
  if (payload.providerKind === "network") {
    return failureCount < 2;
  }
  return false;
}
