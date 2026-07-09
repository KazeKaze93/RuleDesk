import {
  ProviderErrorKindSchema,
  ProviderSearchErrorCodeSchema,
  ProviderSearchErrorPayloadSchema,
  providerKindToErrorCode,
  type ProviderErrorKind,
  type ProviderSearchErrorPayload,
} from "../../shared/schemas/provider-errors";
import {
  PROVIDER_SEARCH_ERROR_TITLES,
  PROVIDER_SEARCH_USER_MESSAGES,
  providerSearchErrorShowsRetry,
} from "../../shared/schemas/provider-errors";

const IPC_INVOKE_PREFIX = /^Error invoking remote method '[^']+':\s*/;

const PROVIDER_CODE_TO_KIND: Record<
  ProviderSearchErrorPayload["code"],
  ProviderErrorKind
> = {
  AUTH_ERROR: "auth",
  RATE_LIMIT: "rate_limit",
  NETWORK_ERROR: "network",
  PARSE_ERROR: "parse",
  UNKNOWN_ERROR: "network",
};

function readUnknownField(error: object, key: string): unknown {
  return Reflect.get(error, key);
}

function stripIpcMessagePrefix(message: string): string {
  return message.replace(IPC_INVOKE_PREFIX, "").trim();
}

function inferKindFromUserMessage(message: string): ProviderErrorKind | null {
  const entries = Object.entries(PROVIDER_SEARCH_USER_MESSAGES) as Array<
    [ProviderErrorKind, string]
  >;
  for (const [kind, text] of entries) {
    if (message === text) {
      return kind;
    }
  }
  return null;
}

function readRetryAfterMs(candidate: Record<string, unknown>): number | undefined {
  const value = candidate.retryAfterMs;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function pickProviderSearchPayload(
  candidate: Record<string, unknown>
): ProviderSearchErrorPayload | null {
  const parsed = ProviderSearchErrorPayloadSchema.safeParse({
    name: candidate.name,
    message: candidate.message,
    code: candidate.code,
    providerKind: candidate.providerKind,
    retryAfterMs: candidate.retryAfterMs,
  });
  return parsed.success ? parsed.data : null;
}

function buildProviderSearchPayloadFromPartial(
  candidate: Record<string, unknown>
): ProviderSearchErrorPayload | null {
  const rawMessage = candidate.message;
  let message =
    typeof rawMessage === "string"
      ? stripIpcMessagePrefix(rawMessage)
      : undefined;
  if (message === "[object Object]") {
    message = undefined;
  }

  const kindFromField = ProviderErrorKindSchema.safeParse(candidate.providerKind);
  const codeParsed = ProviderSearchErrorCodeSchema.safeParse(candidate.code);

  let kind: ProviderErrorKind | null = kindFromField.success
    ? kindFromField.data
    : null;

  if (!kind && codeParsed.success) {
    kind = PROVIDER_CODE_TO_KIND[codeParsed.data];
  }

  if (!kind && message) {
    kind = inferKindFromUserMessage(message);
  }

  if (!kind) {
    return null;
  }

  const resolvedMessage =
    message && message.length > 0
      ? message
      : PROVIDER_SEARCH_USER_MESSAGES[kind];
  const resolvedCode = codeParsed.success
    ? codeParsed.data
    : providerKindToErrorCode(kind);

  const parsed = ProviderSearchErrorPayloadSchema.safeParse({
    name: "ProviderSearchError",
    message: resolvedMessage,
    code: resolvedCode,
    providerKind: kind,
    retryAfterMs: readRetryAfterMs(candidate),
  });
  return parsed.success ? parsed.data : null;
}

function collectErrorCandidates(error: unknown): object[] {
  const candidates: object[] = [];
  if (typeof error !== "object" || error === null) {
    return candidates;
  }

  candidates.push(error);

  const cause = readUnknownField(error, "cause");
  if (typeof cause === "object" && cause !== null) {
    candidates.push(cause);
  }

  return candidates;
}

function candidateFromObject(error: object): Record<string, unknown> {
  return {
    name: readUnknownField(error, "name"),
    message: readUnknownField(error, "message"),
    code: readUnknownField(error, "code"),
    providerKind: readUnknownField(error, "providerKind"),
    retryAfterMs: readUnknownField(error, "retryAfterMs"),
  };
}

export function parseProviderSearchErrorPayload(
  error: unknown
): ProviderSearchErrorPayload | null {
  for (const candidateObject of collectErrorCandidates(error)) {
    const candidate = candidateFromObject(candidateObject);

    const strict = pickProviderSearchPayload(candidate);
    if (strict) {
      return strict;
    }

    const relaxed = buildProviderSearchPayloadFromPartial(candidate);
    if (relaxed) {
      return relaxed;
    }

    const messageField = candidate.message;
    if (typeof messageField === "string") {
      const stripped = stripIpcMessagePrefix(messageField);
      const fromStrippedMessage = buildProviderSearchPayloadFromPartial({
        ...candidate,
        message: stripped,
      });
      if (fromStrippedMessage) {
        return fromStrippedMessage;
      }
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
