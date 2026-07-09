import { describe, expect, it } from "vitest";
import { ProviderSearchError } from "@/main/providers/provider-search-errors";
import { toProviderSearchSerializableError } from "@/main/providers/provider-search-errors";
import { parseProviderSearchErrorPayload } from "@/renderer/utils/provider-search-error";

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
      message: "Rule34 rejected the API credentials. Open Settings → Account and sign in again.",
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
      "Error invoking remote method 'booru:search': Rule34 is rate-limiting requests. Wait a moment, then use Retry."
    );
    Object.assign(ipcError, {
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
    });

    const parsed = parseProviderSearchErrorPayload(ipcError);

    expect(parsed).toEqual({
      name: "ProviderSearchError",
      message:
        "Rule34 is rate-limiting requests. Wait a moment, then use Retry.",
      code: "RATE_LIMIT",
      providerKind: "rate_limit",
      retryAfterMs: undefined,
    });
  });

  it("parseProviderSearchErrorPayload infers kind from IPC message when fields are missing", () => {
    const ipcError = new Error(
      "Error invoking remote method 'booru:search': Rule34 is rate-limiting requests. Wait a moment, then use Retry."
    );

    const parsed = parseProviderSearchErrorPayload(ipcError);

    expect(parsed?.providerKind).toBe("rate_limit");
    expect(parsed?.code).toBe("RATE_LIMIT");
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
    expect(parsed?.message).toBe(
      "Rule34 is rate-limiting requests. Wait a moment, then use Retry."
    );
  });
});
