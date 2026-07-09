import {
  ProviderErrorKindSchema,
  ProviderSearchErrorCodeSchema,
  ProviderSearchErrorPayloadSchema,
  providerKindToErrorCode,
  PROVIDER_SEARCH_USER_MESSAGES,
  type ProviderErrorKind,
  type ProviderSearchErrorPayload,
} from "../schemas/provider-errors";

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

function isUnusableIpcMessage(message: string | undefined): boolean {
  return message === undefined || message.length === 0 || message === "[object Object]";
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

function tryParseJsonProviderPayload(
  message: string
): Record<string, unknown> | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function buildProviderSearchPayloadFromPartial(
  candidate: Record<string, unknown>
): ProviderSearchErrorPayload | null {
  const rawMessage = candidate.message;
  let message =
    typeof rawMessage === "string"
      ? stripIpcMessagePrefix(rawMessage)
      : undefined;
  if (isUnusableIpcMessage(message)) {
    message = undefined;
  }

  const jsonFromMessage =
    typeof message === "string" ? tryParseJsonProviderPayload(message) : null;
  const mergedCandidate = jsonFromMessage
    ? { ...candidate, ...jsonFromMessage }
    : candidate;

  const kindFromField = ProviderErrorKindSchema.safeParse(
    mergedCandidate.providerKind ?? mergedCandidate.kind
  );
  const codeParsed = ProviderSearchErrorCodeSchema.safeParse(
    mergedCandidate.code
  );

  let kind: ProviderErrorKind | null = kindFromField.success
    ? kindFromField.data
    : null;

  if (!kind && codeParsed.success) {
    kind = PROVIDER_CODE_TO_KIND[codeParsed.data];
  }

  const resolvedMessageFromMerge =
    typeof mergedCandidate.message === "string"
      ? stripIpcMessagePrefix(mergedCandidate.message)
      : undefined;
  const usableMergedMessage = isUnusableIpcMessage(resolvedMessageFromMerge)
    ? undefined
    : resolvedMessageFromMerge;

  if (!kind && usableMergedMessage) {
    kind = inferKindFromUserMessage(usableMergedMessage);
  }

  if (!kind && message) {
    kind = inferKindFromUserMessage(message);
  }

  if (!kind) {
    return null;
  }

  const resolvedMessage =
    usableMergedMessage ??
    (message && message.length > 0 ? message : undefined) ??
    PROVIDER_SEARCH_USER_MESSAGES[kind];
  const resolvedCode = codeParsed.success
    ? codeParsed.data
    : providerKindToErrorCode(kind);

  const parsed = ProviderSearchErrorPayloadSchema.safeParse({
    name: "ProviderSearchError",
    message: resolvedMessage,
    code: resolvedCode,
    providerKind: kind,
    retryAfterMs: readRetryAfterMs(mergedCandidate),
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
    providerKind:
      readUnknownField(error, "providerKind") ?? readUnknownField(error, "kind"),
    retryAfterMs: readUnknownField(error, "retryAfterMs"),
  };
}

/**
 * Parse a provider search failure from an IPC invoke rejection or re-thrown Browse error.
 * Tolerates Electron's Error wrapper, JSON-serialized payloads, and partial field sets.
 */
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

export function rethrowNormalizedProviderSearchError(error: unknown): never {
  const payload = parseProviderSearchErrorPayload(error);
  if (payload) {
    const normalized = new Error(payload.message);
    Object.assign(normalized, {
      name: payload.name,
      code: payload.code,
      providerKind: payload.providerKind,
      kind: payload.providerKind,
      retryAfterMs: payload.retryAfterMs,
    });
    throw normalized;
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(String(error));
}
