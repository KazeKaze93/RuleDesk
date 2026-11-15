import { describe, expect, it } from "vitest";

import { parseApiCredentials } from "../../src/storage/api-credentials";

describe("parseApiCredentials", () => {
  it("splits the line the site shows, in any order and inside an address", () => {
    expect(parseApiCredentials("&api_key=abc123&user_id=42")).toEqual({
      userId: "42",
      apiKey: "abc123",
    });
    expect(parseApiCredentials("  user_id=42&api_key=abc123  ")).toEqual({
      userId: "42",
      apiKey: "abc123",
    });
    expect(
      parseApiCredentials(
        "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&api_key=a%2Bb&user_id=7#x",
      ),
    ).toEqual({ userId: "7", apiKey: "a+b" });
  });

  it("refuses a line without both parts", () => {
    expect(parseApiCredentials("abc123")).toBeNull();
    expect(parseApiCredentials("&api_key=abc123")).toBeNull();
    expect(parseApiCredentials("&user_id=42")).toBeNull();
    expect(parseApiCredentials("")).toBeNull();
  });
});
