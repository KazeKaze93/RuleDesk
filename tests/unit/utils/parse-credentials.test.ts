import { describe, expect, it } from "vitest";
import {
  normalizeCredentialsInput,
  parseCredentialsFromText,
} from "../../../src/shared/utils/parse-credentials";

describe("parseCredentialsFromText", () => {
  it("parses credentials without leading ampersand", () => {
    expect(parseCredentialsFromText("api_key=abc1234567&user_id=42")).toEqual({
      apiKey: "abc1234567",
      userId: "42",
    });
  });

  it("parses query-string credentials with leading ampersand", () => {
    expect(
      parseCredentialsFromText("&api_key=abc1234567&user_id=42")
    ).toEqual({
      apiKey: "abc1234567",
      userId: "42",
    });
  });

  it("parses credentials from full URL", () => {
    expect(
      parseCredentialsFromText(
        "https://rule34.xxx/index.php?page=account&s=options&api_key=key1234567&user_id=99"
      )
    ).toEqual({
      apiKey: "key1234567",
      userId: "99",
    });
  });
});

describe("normalizeCredentialsInput", () => {
  it("extracts api key and user id from combined paste in apiKey field", () => {
    expect(
      normalizeCredentialsInput({
        apiKey: "api_key=mysecretkey12&user_id=12345",
      })
    ).toEqual({
      apiKey: "mysecretkey12",
      userId: "12345",
    });
  });

  it("keeps plain api key when query params are absent", () => {
    expect(
      normalizeCredentialsInput({
        userId: "7",
        apiKey: "plain-api-key-value",
      })
    ).toEqual({
      userId: "7",
      apiKey: "plain-api-key-value",
    });
  });

  it("merges user id from api key field when userId input is empty", () => {
    expect(
      normalizeCredentialsInput({
        userId: "",
        apiKey: "&api_key=onlykey12345&user_id=999",
      })
    ).toEqual({
      apiKey: "onlykey12345",
      userId: "999",
    });
  });
});
