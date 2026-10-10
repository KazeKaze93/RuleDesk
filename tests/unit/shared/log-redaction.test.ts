import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import {
  CIRCULAR_PLACEHOLDER,
  HOME_TILDE,
  REDACTED_VALUE,
  USERNAME_MASK,
  createRedactionContext,
  redactForLog,
  redactLogData,
  redactString,
} from "@/shared/utils/log-redaction";

const WINDOWS_HOME = "C:\\Users\\alice";
const MAC_HOME = "/Users/alice";
const LINUX_HOME = "/home/alice";
const WINDOWS_HOME_USER = "C:\\Users\\user";

describe("redactString — query parameters", () => {
  it("redacts api_key/user_id at the start of a query string", () => {
    const raw = "api_key=secret-key&user_id=99&tags=test";
    const out = redactString(raw, createRedactionContext(""));
    expect(out).toBe(
      `api_key=${REDACTED_VALUE}&user_id=${REDACTED_VALUE}&tags=test`
    );
  });

  it("redacts credentials in the middle of a URL", () => {
    const raw =
      "https://api.rule34.xxx/index.php?page=dapi&api_key=mid-secret&json=1&user_id=42";
    const out = redactString(raw, createRedactionContext(""));
    expect(out).toContain(`api_key=${REDACTED_VALUE}`);
    expect(out).toContain(`user_id=${REDACTED_VALUE}`);
    expect(out).not.toContain("mid-secret");
    expect(out).toContain("page=dapi");
    expect(out).toContain("json=1");
  });

  it("redacts credentials at the end of a string", () => {
    const raw = "https://gelbooru.com/index.php?page=dapi&api_key=tail-secret";
    const out = redactString(raw, createRedactionContext(""));
    expect(out.endsWith(`api_key=${REDACTED_VALUE}`)).toBe(true);
    expect(out).not.toContain("tail-secret");
  });

  it("redacts URL-encoded credential values", () => {
    const raw =
      "https://example.com/?api_key=ab%2Fcd%3D&user_id=1%202&other=ok";
    const out = redactString(raw, createRedactionContext(""));
    expect(out).toContain(`api_key=${REDACTED_VALUE}`);
    expect(out).toContain(`user_id=${REDACTED_VALUE}`);
    expect(out).not.toContain("ab%2Fcd");
    expect(out).toContain("other=ok");
  });
});

describe("redactString — username 'user' must not corrupt query keys", () => {
  it("redacts user_id value while leaving user_id / users intact", () => {
    const ctx = createRedactionContext(WINDOWS_HOME_USER);
    expect(ctx.username).toBe("user");

    const raw =
      "SELECT * FROM users WHERE id=1; https://api/?user_id=123&api_key=k&tags=users";
    const out = redactString(raw, ctx);

    expect(out).toContain(`user_id=${REDACTED_VALUE}`);
    expect(out).toContain(`api_key=${REDACTED_VALUE}`);
    expect(out).toContain("FROM users WHERE");
    expect(out).toContain("tags=users");
    expect(out).not.toContain("user_id=123");
    expect(out).not.toMatch(/<user>_id=/);
    expect(out).not.toContain("FROM <user>s");
  });
});

describe("redactString — URL userinfo", () => {
  it("masks login:pass@ in proxy URLs", () => {
    const raw = "http://login:pass@proxy.example:8080";
    const out = redactString(raw, createRedactionContext(""));
    expect(out).toBe(`http://${REDACTED_VALUE}@proxy.example:8080`);
    expect(out).not.toContain("login");
    expect(out).not.toContain("pass");
  });
});

describe("redactString — OS paths", () => {
  it("turns Windows user paths into ~/...", () => {
    const raw = "C:\\Users\\alice\\AppData\\Local\\RuleDesk-Data\\logs\\app.log";
    const out = redactString(raw, createRedactionContext(WINDOWS_HOME));
    expect(out).toBe(
      `${HOME_TILDE}\\AppData\\Local\\RuleDesk-Data\\logs\\app.log`
    );
    expect(out).not.toContain("alice");
  });

  it("turns macOS /Users/<name>/... into ~/...", () => {
    const raw = "/Users/alice/Library/Logs/RuleDesk/app.log";
    const out = redactString(raw, createRedactionContext(MAC_HOME));
    expect(out).toBe(`${HOME_TILDE}/Library/Logs/RuleDesk/app.log`);
    expect(out).not.toContain("alice");
  });

  it("turns Linux /home/<name>/... into ~/...", () => {
    const raw = "/home/alice/.config/RuleDesk/logs/app.log";
    const out = redactString(raw, createRedactionContext(LINUX_HOME));
    expect(out).toBe(`${HOME_TILDE}/.config/RuleDesk/logs/app.log`);
    expect(out).not.toContain("alice");
  });

  it("masks username in paths outside home when home context is known", () => {
    const raw = "D:\\Projects\\alice\\cache\\file.bin";
    const out = redactString(raw, createRedactionContext(WINDOWS_HOME));
    expect(out).toBe(`D:\\Projects\\${USERNAME_MASK}\\cache\\file.bin`);
  });

  it("does not mask bare path-like username segments without home context", () => {
    const raw = "D:\\Projects\\alice\\cache\\file.bin";
    const out = redactString(raw, createRedactionContext(""));
    expect(out).toBe(raw);
  });
});

describe("redactForLog — AxiosError shape", () => {
  it("redacts config.url, config.params, and request.path/_header query values", () => {
    const apiKey = "axios-leak-key-9f3a";
    const userId = "778899";
    const query = `api_key=${apiKey}&user_id=${userId}`;

    const requestLike = {
      path: `/index.php?${query}`,
      _header: `GET /index.php?${query} HTTP/1.1`,
    };

    const axiosError = new AxiosError(
      `Request failed for https://api.rule34.xxx/index.php?${query}`,
      "ERR_BAD_REQUEST",
      {
        url: `https://api.rule34.xxx/index.php?${query}`,
        params: {
          api_key: apiKey,
          user_id: userId,
          tags: "safe_tag",
        },
      },
      requestLike,
      undefined
    );

    const out = redactForLog(axiosError, WINDOWS_HOME_USER);
    const serialized = JSON.stringify(out);

    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(userId);
    expect(serialized).not.toContain(`user_id=${userId}`);
    expect(serialized).toContain(`api_key=${REDACTED_VALUE}`);
    expect(serialized).toContain(`"api_key":"${REDACTED_VALUE}"`);
    expect(serialized).toContain(`"user_id":"${REDACTED_VALUE}"`);
    expect(serialized).toContain("safe_tag");

    if (
      typeof out === "object" &&
      out !== null &&
      "config" in out &&
      typeof out.config === "object" &&
      out.config !== null &&
      "request" in out &&
      typeof out.request === "object" &&
      out.request !== null
    ) {
      const config = out.config;
      const request = out.request;
      expect(JSON.stringify(config)).not.toContain(apiKey);
      expect(JSON.stringify(request)).not.toContain(apiKey);
    }
  });
});

describe("redactForLog — structured values", () => {
  it("does not distort ordinary log messages", () => {
    const msg = "SyncService: Page 3 rawItemCount=100, continuing";
    expect(redactForLog(msg, "")).toBe(msg);
  });

  it("leaves null, numbers, and booleans unchanged", () => {
    expect(redactForLog(null, "")).toBeNull();
    expect(redactForLog(undefined, "")).toBeUndefined();
    expect(redactForLog(42, "")).toBe(42);
    expect(redactForLog(true, "")).toBe(true);
  });

  it("redacts nested objects without mutating the original", () => {
    const original = {
      url: "https://api.rule34.xxx/?api_key=nested-secret&user_id=7",
      meta: { api_key: "object-key-secret", safe: "ok" },
    };
    const copy = structuredClone(original);
    const out = redactForLog(original, "");

    expect(original).toEqual(copy);
    expect(out).toEqual({
      url: `https://api.rule34.xxx/?api_key=${REDACTED_VALUE}&user_id=${REDACTED_VALUE}`,
      meta: { api_key: REDACTED_VALUE, safe: "ok" },
    });
  });

  it("redacts Error message/stack that contain credentials or paths", () => {
    const err = new Error(
      `Request failed: https://api.rule34.xxx/?api_key=err-secret&user_id=1 path=${WINDOWS_HOME}\\tmp`
    );
    err.stack = `Error: leak\n    at ${WINDOWS_HOME}\\app\\main.js:1:1`;

    const out = redactForLog(err, WINDOWS_HOME);
    expect(out).toMatchObject({
      name: "Error",
      message: expect.stringContaining(`api_key=${REDACTED_VALUE}`),
    });
    if (
      typeof out === "object" &&
      out !== null &&
      "message" in out &&
      "stack" in out
    ) {
      expect(String(out.message)).not.toContain("err-secret");
      expect(String(out.message)).not.toContain("alice");
      expect(String(out.stack)).toContain(HOME_TILDE);
      expect(String(out.stack)).not.toContain("alice");
    }
    expect(err.message).toContain("err-secret");
  });

  it("does not throw on circular objects", () => {
    const cyclic: { self?: unknown; url: string } = {
      url: "https://x.test/?api_key=cycle-secret",
    };
    cyclic.self = cyclic;

    const out = redactForLog(cyclic, "");
    expect(out).toEqual({
      url: `https://x.test/?api_key=${REDACTED_VALUE}`,
      self: CIRCULAR_PLACEHOLDER,
    });
  });

  it("is idempotent under a second redaction pass (main+renderer double hook)", () => {
    const ctx = createRedactionContext(WINDOWS_HOME_USER);
    const raw = {
      proxy: "http://login:pass@127.0.0.1:8080",
      url: "https://api/?api_key=once-secret&user_id=55",
      path: "D:\\Projects\\user\\cache",
      note: "FROM users JOIN tags",
    };
    const first = redactForLog(raw, ctx);
    const second = redactForLog(first, ctx);
    expect(second).toEqual(first);
    expect(JSON.stringify(second)).not.toContain("once-secret");
    expect(JSON.stringify(second)).not.toContain("login:pass");
  });
});

describe("redactLogData", () => {
  it("redacts each log argument independently", () => {
    const data = redactLogData(["ok", { user_id: "should-hide" }, 3], "");
    expect(data).toEqual(["ok", { user_id: REDACTED_VALUE }, 3]);
  });
});
