import {
  providerKindToErrorCode,
  PROVIDER_SEARCH_USER_MESSAGES,
  ProviderSearchErrorPayloadSchema,
  type ProviderErrorKind,
  type ProviderSearchErrorPayload,
} from "../../shared/schemas/provider-errors";

export class ProviderSearchError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;

  constructor(
    kind: ProviderErrorKind,
    message?: string,
    retryAfterMs?: number
  ) {
    super(message ?? PROVIDER_SEARCH_USER_MESSAGES[kind]);
    this.name = "ProviderSearchError";
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isProviderSearchError(
  error: unknown
): error is ProviderSearchError {
  return error instanceof ProviderSearchError;
}

export function toProviderSearchSerializableError(
  error: ProviderSearchError
): ProviderSearchErrorPayload {
  const payload = {
    name: "ProviderSearchError" as const,
    message: error.message,
    code: providerKindToErrorCode(error.kind),
    providerKind: error.kind,
    retryAfterMs: error.retryAfterMs,
  };
  return ProviderSearchErrorPayloadSchema.parse(payload);
}

/**
 * IPC-safe throw. Electron invoke keeps Error.message and drops custom fields,
 * so the full payload (including providerKind) is JSON-encoded into message.
 * Enumerable fields remain for in-process / mocked invoke.
 */
export function throwProviderSearchIpcError(error: ProviderSearchError): never {
  const payload = toProviderSearchSerializableError(error);
  const ipcError = new Error(JSON.stringify(payload));
  Object.assign(ipcError, {
    name: payload.name,
    code: payload.code,
    providerKind: payload.providerKind,
    retryAfterMs: payload.retryAfterMs,
  });
  throw ipcError;
}

export function providerSearchErrorFromUnknown(
  error: unknown
): ProviderSearchError {
  if (isProviderSearchError(error)) {
    return error;
  }
  return new ProviderSearchError("network");
}
