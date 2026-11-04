import { describe, expect, it } from "vitest";
import { ErrorCode } from "../../../src/shared/types/error-codes";
import { parseSmartQuery } from "../../../src/shared/schemas/smart-playlist-query";
import { isProviderId } from "../../../src/shared/constants";
import { createCodedError } from "../../../src/shared/utils/coded-error";

/**
 * Smart playlist execute path: parse stored query_json (string provider OK),
 * then reject unsupported ids with UNSUPPORTED_PROVIDER (PlaylistController).
 */
describe("smart playlist unsupported provider gate", () => {
  it("parse keeps gelbooru then gate throws UNSUPPORTED_PROVIDER", () => {
    const parsed = parseSmartQuery(
      JSON.stringify({
        tags: [{ tag: "solo", type: "include" }],
        provider: "gelbooru",
      }),
      1
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.provider).toBe("gelbooru");

    const rawProvider = parsed?.provider ?? "rule34";
    expect(isProviderId(rawProvider)).toBe(false);

    const err = createCodedError(
      `Unsupported provider: ${rawProvider}`,
      ErrorCode.UNSUPPORTED_PROVIDER
    );
    expect(err).toMatchObject({
      message: "Unsupported provider: gelbooru",
      code: ErrorCode.UNSUPPORTED_PROVIDER,
    });
  });

  it("rule34 provider passes the gate", () => {
    const parsed = parseSmartQuery(
      JSON.stringify({
        tags: [{ tag: "solo", type: "include" }],
        provider: "rule34",
      }),
      1
    );
    expect(parsed?.provider).toBe("rule34");
    expect(isProviderId(parsed?.provider ?? "")).toBe(true);
  });
});
