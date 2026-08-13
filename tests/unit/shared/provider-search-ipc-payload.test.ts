import { describe, expect, it } from "vitest";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
import {
  throwProviderSearchIpcError,
  toProviderSearchSerializableError,
} from "@/main/providers/provider-search-errors";
import {
  BrowseSearchError,
  toBrowseSearchError,
} from "@/renderer/utils/provider-search-error";
import { PROVIDER_SEARCH_ERROR_TITLES, PROVIDER_SEARCH_USER_MESSAGES } from "@/shared/schemas/provider-errors";
import { parseProviderSearchErrorPayload } from "@/shared/utils/provider-search-ipc";

describe("provider search IPC payload hygiene", () => {
  it("toProviderSearchSerializableError omits stack and originalError", () => {
    const source = new ProviderSearchError("auth");
    source.stack = "Error: leak\n    at https://api.rule34.xxx?api_key=secret";

    const payload = toProviderSearchSerializableError(source);

    expect(payload).toEqual({
      name: "ProviderSearchError",
      message: source.message,
      code: "AUTH_ERROR",
      providerKind: "auth",
      retryAfterMs: undefined,
    });
    expect(Object.hasOwn(payload, "stack")).toBe(false);
    expect(Object.hasOwn(payload, "originalError")).toBe(false);
  });

  it("parseProviderSearchErrorPayload strips extra IPC fields", () => {
    const parsed = parseProviderSearchErrorPayload({
      name: "ProviderSearchError",
      message: PROVIDER_SEARCH_USER_MESSAGES.auth,
      code: "AUTH_ERROR",
      providerKind: "auth",
      stack: "must not surface in renderer",
      originalError: "api_key=leaked",
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.providerKind).toBe("auth");
    expect(Object.hasOwn(parsed ?? {}, "stack")).toBe(false);
    expect(Object.hasOwn(parsed ?? {}, "originalError")).toBe(false);
  });

  it("parseProviderSearchErrorPayload handles Electron IPC Error wrapper", () => {
    const ipcError = new Error(
      `Error invoking remote method 'booru:search': ${PROVIDER_SEARCH_USER_MESSAGES.rate_limit}`
    );
    Object.assign(ipcError, {
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
    });

    const parsed = parseProviderSearchErrorPayload(ipcError);

    expect(parsed).toEqual({
      name: "ProviderSearchError",
      message: PROVIDER_SEARCH_USER_MESSAGES.rate_limit,
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
      retryAfterMs: undefined,
    });
  });

  it("throwProviderSearchIpcError JSON-encodes kind so it survives message-only IPC", () => {
    const source = new ProviderSearchError("network");
    let thrown: unknown;
    try {
      throwProviderSearchIpcError(source);
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    if (!(thrown instanceof Error)) {
      throw new Error("expected Error");
    }

    const encoded: unknown = JSON.parse(thrown.message);
    expect(encoded).toMatchObject({
      name: "ProviderSearchError",
      providerKind: "network",
      code: "NETWORK_ERROR",
      message: PROVIDER_SEARCH_USER_MESSAGES.network,
    });

    const electronStripped = new Error(
      `Error invoking remote method 'booru:search': ${thrown.message}`
    );
    const parsed = parseProviderSearchErrorPayload(electronStripped);

    expect(parsed?.providerKind).toBe("network");
    expect(parsed?.code).toBe("NETWORK_ERROR");
    expect(parsed?.message).toBe(PROVIDER_SEARCH_USER_MESSAGES.network);
    expect(parsed?.message).not.toMatch(/Rule34/i);

    const inProcess = parseProviderSearchErrorPayload(thrown);
    expect(inProcess?.message).toBe(PROVIDER_SEARCH_USER_MESSAGES.network);
    expect(inProcess?.providerKind).toBe("network");
  });

  it("user-facing provider search copy does not hardcode a provider name", () => {
    const kinds = ["auth", "rate_limit", "network", "parse"] as const;
    for (const kind of kinds) {
      expect(PROVIDER_SEARCH_USER_MESSAGES[kind]).not.toMatch(/Rule34|Gelbooru/i);
      expect(PROVIDER_SEARCH_ERROR_TITLES[kind]).not.toMatch(/Rule34|Gelbooru/i);
    }
  });

  it("parseProviderSearchErrorPayload does not infer kind from user-facing copy", () => {
    const ipcError = new Error(
      `Error invoking remote method 'booru:search': ${PROVIDER_SEARCH_USER_MESSAGES.rate_limit}`
    );

    expect(parseProviderSearchErrorPayload(ipcError)).toBeNull();
  });

  it("parseProviderSearchErrorPayload handles [object Object] IPC message with attached fields", () => {
    const ipcError = new Error(
      "Error invoking remote method 'booru:search': [object Object]"
    );
    Object.assign(ipcError, {
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
    });

    const parsed = parseProviderSearchErrorPayload(ipcError);

    expect(parsed?.providerKind).toBe("rate_limit");
    expect(parsed?.message).toBe(PROVIDER_SEARCH_USER_MESSAGES.rate_limit);
  });

  it("parseProviderSearchErrorPayload handles JSON-serialized IPC message body", () => {
    const payload = {
      name: "ProviderSearchError",
      message: PROVIDER_SEARCH_USER_MESSAGES.auth,
      code: "AUTH_ERROR",
      providerKind: "auth",
    };
    const ipcError = new Error(
      `Error invoking remote method 'booru:search': ${JSON.stringify(payload)}`
    );

    const parsed = parseProviderSearchErrorPayload(ipcError);

    expect(parsed?.providerKind).toBe("auth");
    expect(parsed?.code).toBe("AUTH_ERROR");
    expect(parsed?.message).toBe(PROVIDER_SEARCH_USER_MESSAGES.auth);
  });

  it("toBrowseSearchError preserves BrowseSearchError from queryFn", () => {
    const typed = new BrowseSearchError({
      name: "ProviderSearchError",
      message: PROVIDER_SEARCH_USER_MESSAGES.rate_limit,
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
    });

    expect(toBrowseSearchError(typed)).toBe(typed);
  });

  it("toBrowseSearchError reads kind field from re-thrown normalized errors", () => {
    const ipcError = new Error(PROVIDER_SEARCH_USER_MESSAGES.rate_limit);
    Object.assign(ipcError, {
      name: "ProviderSearchError",
      code: "RATE_LIMIT",
      kind: "rate_limit",
    });

    const parsed = toBrowseSearchError(ipcError);

    expect(parsed?.kind).toBe("rate_limit");
  });
});
