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

describe("SecureStorage.encrypt", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    mockIsEncryptionAvailable.mockReturnValue(false);
    mockEncryptString.mockImplementation(() => {
      throw new Error("encrypt failed");
    });
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns empty string for empty plaintext", async () => {
    const { SecureStorage } = await import("@/main/services/secure-storage");
    expect(SecureStorage.encrypt("")).toBe("");
  });

  it("uses test credential encoding when safeStorage is unavailable in test runtime", async () => {
    const { SecureStorage } = await import("@/main/services/secure-storage");
    const { decodeTestCredential } = await import(
      "@/main/lib/test-credential-cipher"
    );

    const encoded = SecureStorage.encrypt("secret-api-key");
    expect(encoded.startsWith("rd-test:v1:")).toBe(true);
    expect(decodeTestCredential(encoded)).toBe("secret-api-key");
  });

  it("throws when safeStorage is unavailable outside test runtime", async () => {
    process.env.NODE_ENV = "production";
    const { SecureStorage } = await import("@/main/services/secure-storage");

    expect(() => SecureStorage.encrypt("secret-api-key")).toThrow(
      /Encryption is not available/i
    );
  });
});
