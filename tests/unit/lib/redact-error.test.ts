import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import {
  redactCredentialQueryParams,
  redactErrorForLog,
} from "@/main/lib/redact-error";

describe("redactCredentialQueryParams", () => {
  it("redacts api_key and user_id from absolute URLs", () => {
    const raw =
      "https://api.rule34.xxx/index.php?page=dapi&api_key=secret-key-value&user_id=12345&json=1";
    const redacted = redactCredentialQueryParams(raw);

    expect(redacted).toContain("api_key=%3Credacted%3E");
    expect(redacted).toContain("user_id=%3Credacted%3E");
    expect(redacted).not.toContain("secret-key-value");
    expect(redacted).not.toContain("12345");
    expect(redacted).toContain("json=1");
  });

  it("redacts credentials from malformed relative URLs via fallback", () => {
    const raw = "/index.php?api_key=plain-secret&user_id=99&tags=test";
    const redacted = redactCredentialQueryParams(raw);

    expect(redacted).toContain("api_key=<redacted>");
    expect(redacted).toContain("user_id=<redacted>");
    expect(redacted).not.toContain("plain-secret");
    expect(redacted).toContain("tags=test");
  });
});

describe("redactErrorForLog", () => {
  it("returns a safe summary for AxiosError with credential URL", () => {
    const axiosError = new AxiosError(
      "Network Error",
      "ERR_NETWORK",
      {
        url: "https://gelbooru.com/index.php?api_key=leaked-key&user_id=42",
      },
      undefined,
      undefined
    );

    const safe = redactErrorForLog(axiosError);

    expect(safe.message).toBe("Network Error");
    expect(safe.code).toBe("ERR_NETWORK");
    expect(safe.url).toContain("api_key=%3Credacted%3E");
    expect(safe.url).toContain("user_id=%3Credacted%3E");
    expect(JSON.stringify(safe)).not.toContain("leaked-key");
    expect(JSON.stringify(safe)).not.toContain("user_id=42");
  });

  it("does not forward config for non-axios Errors", () => {
    const safe = redactErrorForLog(new Error("parse failed"));
    expect(safe).toEqual({
      message: "parse failed",
      name: "Error",
    });
  });

  it("stringifies unknown non-error values", () => {
    expect(redactErrorForLog(42)).toEqual({ message: "42" });
  });
});
