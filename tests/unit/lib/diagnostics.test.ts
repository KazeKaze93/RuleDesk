import { describe, expect, it } from "vitest";
import {
  decodeLogTailBuffer,
  fitDiagnosticsToMaxChars,
  formatDiagnosticsClipboardText,
  redactDiagnosticsLogTail,
  redactDiagnosticsPath,
  skipLeadingUtf8Continuation,
  trimPartialFirstLine,
} from "@/main/lib/diagnostics";
import { GITHUB_ISSUE_BODY_MAX_CHARS } from "@/main/config/constants";
import { REDACTED_VALUE } from "@/shared/utils/log-redaction";
import type { AppInfo } from "@/shared/schemas/system";

const WINDOWS_HOME = "C:\\Users\\alice";

const sampleAppInfo: AppInfo = {
  appVersion: "18.1.0",
  electronVersion: "33.0.0",
  chromeVersion: "130.0.0.0",
  nodeVersion: "20.0.0",
  osPlatform: "win32",
  osRelease: "10.0.26300",
  osArch: "x64",
};

describe("redactDiagnosticsLogTail", () => {
  it("redacts credentials and OS paths in a dirty historical log tail", () => {
    const dirtyTail = [
      `[2026-08-13 01:25:17.372] [info]  [Main] userData path: C:\\Users\\alice\\AppData\\Local\\RuleDesk-Data`,
      `[error] Axios failed https://api.rule34.xxx/index.php?api_key=leaked-secret-key&user_id=479099&json=1`,
    ].join("\n");

    const redacted = redactDiagnosticsLogTail(dirtyTail, WINDOWS_HOME);

    expect(redacted).not.toContain("leaked-secret-key");
    expect(redacted).not.toContain("479099");
    expect(redacted).not.toContain("C:\\Users\\alice");
    expect(redacted).toContain(`api_key=${REDACTED_VALUE}`);
    expect(redacted).toContain(`user_id=${REDACTED_VALUE}`);
  });
});

describe("redactDiagnosticsPath", () => {
  it("masks the home prefix in the log file path", () => {
    const raw = `${WINDOWS_HOME}\\AppData\\Local\\RuleDesk-Data\\logs\\app.log`;
    expect(redactDiagnosticsPath(raw, WINDOWS_HOME)).toBe(
      "~\\AppData\\Local\\RuleDesk-Data\\logs\\app.log"
    );
  });
});

describe("decodeLogTailBuffer — mid-window cuts", () => {
  it("drops a partial first line that starts mid api_key/user_id so fragments never leak", () => {
    const full =
      "prefix noise\napi_key=SECRET_VALUE_XYZ&user_id=12345\nsafe line after\n";
    const fullBuffer = Buffer.from(full, "utf8");
    const cutAt = fullBuffer.indexOf("SECRET_VALUE_XYZ") + 4;
    const window = fullBuffer.subarray(cutAt);

    const decoded = decodeLogTailBuffer(window, true);
    const redacted = redactDiagnosticsLogTail(decoded, WINDOWS_HOME);

    expect(redacted).not.toContain("SECRET");
    expect(redacted).not.toContain("ET_VALUE");
    expect(redacted).not.toContain("12345");
    expect(redacted).not.toContain("user_id=");
    expect(redacted).toContain("safe line after");
  });

  it("drops a partial first line that starts mid OS user path", () => {
    const full =
      "noise\nC:\\Users\\alice\\AppData\\Local\\RuleDesk-Data\\data.bin\nnext ok\n";
    const fullBuffer = Buffer.from(full, "utf8");
    const cutAt = fullBuffer.indexOf("alice") + 2;
    const window = fullBuffer.subarray(cutAt);

    const decoded = decodeLogTailBuffer(window, true);
    const redacted = redactDiagnosticsLogTail(decoded, WINDOWS_HOME);

    expect(redacted).not.toContain("alice");
    expect(redacted).not.toContain("ice\\AppData");
    expect(redacted).toContain("next ok");
  });

  it("skips leading UTF-8 continuation bytes so output is valid without mojibake", () => {
    // Cyrillic "Ж" is D0 96 in UTF-8. Cut after D0 so window starts with continuation 0x96.
    const full = Buffer.from("prefix\nстрока с Ж символом\ntrail\n", "utf8");
    const zhIndex = full.indexOf(Buffer.from("Ж", "utf8"));
    expect(zhIndex).toBeGreaterThan(0);
    const window = full.subarray(zhIndex + 1);

    const decoded = decodeLogTailBuffer(window, true);

    expect(decoded.includes("\uFFFD")).toBe(false);
    expect(decoded).toContain("trail");
  });

  it("keeps the first line when the file fits entirely in the window", () => {
    const full = Buffer.from(
      "first line keeps https://x.test/?api_key=should-still-be-here-for-redaction&user_id=1\nsecond\n",
      "utf8"
    );
    const decoded = decodeLogTailBuffer(full, false);
    expect(decoded.startsWith("first line keeps")).toBe(true);

    const redacted = redactDiagnosticsLogTail(decoded, WINDOWS_HOME);
    expect(redacted).toContain("first line keeps");
    expect(redacted).toContain(`api_key=${REDACTED_VALUE}`);
    expect(redacted).not.toContain("should-still-be-here-for-redaction");
  });
});

describe("skipLeadingUtf8Continuation", () => {
  it("removes leading continuation bytes only", () => {
    const buf = Buffer.from([0x96, 0x41, 0x42]);
    expect(skipLeadingUtf8Continuation(buf).equals(Buffer.from([0x41, 0x42]))).toBe(
      true
    );
  });
});

describe("trimPartialFirstLine", () => {
  it("drops the first partial line when the read started mid-file", () => {
    expect(trimPartialFirstLine("partial\nfull line\n", true)).toBe(
      "full line\n"
    );
  });

  it("discards the whole window when mid-file and there is no newline", () => {
    expect(trimPartialFirstLine("CRET&user_id=123", true)).toBe("");
  });

  it("keeps the full text when the read started at byte 0", () => {
    expect(trimPartialFirstLine("full line\n", false)).toBe("full line\n");
  });
});

describe("fitDiagnosticsToMaxChars", () => {
  it("keeps header + tail under the GitHub issue body limit", () => {
    const hugeTail = Array.from({ length: 4000 }, (_, i) =>
      `line-${i} ${"x".repeat(40)}`
    ).join("\n");

    const fitted = fitDiagnosticsToMaxChars({
      appInfo: sampleAppInfo,
      logPath: "~\\logs\\app.log",
      logTail: hugeTail,
      maxChars: GITHUB_ISSUE_BODY_MAX_CHARS,
    });

    expect(fitted.clipboardText.length).toBeLessThanOrEqual(
      GITHUB_ISSUE_BODY_MAX_CHARS
    );
    expect(fitted.clipboardText).toContain("RuleDesk diagnostics");
    expect(fitted.clipboardText).toContain("App: 18.1.0");
  });
});

describe("formatDiagnosticsClipboardText", () => {
  it("includes versions, OS, redacted path, and log tail", () => {
    const text = formatDiagnosticsClipboardText({
      appInfo: sampleAppInfo,
      logPath: "~\\AppData\\Local\\RuleDesk-Data\\logs\\app.log",
      logTail: `api_key=${REDACTED_VALUE}`,
    });

    expect(text).toContain("App: 18.1.0");
    expect(text).toContain("Electron: 33.0.0");
    expect(text).toContain(`api_key=${REDACTED_VALUE}`);
  });
});
