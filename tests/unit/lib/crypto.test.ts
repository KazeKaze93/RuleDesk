import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockIsEncryptionAvailable = vi.fn(() => false);
const mockEncryptString = vi.fn(() => {
  throw new Error("encrypt failed");
});

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: () => mockIsEncryptionAvailable(),
    encryptString: (...args: unknown[]) => mockEncryptString(...args),
    decryptString: vi.fn(),
  },
}));

vi.mock("electron-log", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    transports: {
      main: { level: false },
      renderer: { level: false },
      console: { level: false, format: "" },
      file: { level: "info", resolvePathFn: vi.fn() },
      ipc: {},
    },
    errorHandler: { startCatching: vi.fn() },
  },
}));

describe("crypto encrypt (test runtime)", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    mockIsEncryptionAvailable.mockReturnValue(false);
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("uses test credential encoding when safeStorage is unavailable", async () => {
    const { encrypt } = await import("@/main/lib/crypto");
    const { decodeTestCredential } = await import(
      "@/main/lib/test-credential-cipher"
    );

    const encoded = encrypt("secret-api-key");
    expect(encoded.startsWith("rd-test:v1:")).toBe(true);
    expect(decodeTestCredential(encoded)).toBe("secret-api-key");
  });
});
