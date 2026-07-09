import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDecryptString = vi.fn();
const mockIsEncryptionAvailable = vi.fn(() => true);

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: () => mockIsEncryptionAvailable(),
    decryptString: (...args: unknown[]) => mockDecryptString(...args),
    encryptString: (text: string) => Buffer.from(text),
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

import { SecureStorage } from "@/main/services/secure-storage";
import {
  CredentialDecryptionError,
  decryptStoredApiKey,
  getDecryptedCredentialsFromRecord,
  getDecryptedCredentialsStrict,
  hasConfiguredApiKey,
} from "@/main/utils/decrypted-credentials";

describe("decrypted-credentials", () => {
  const corruptedBase64 = Buffer.from("not-a-real-ciphertext").toString("base64");

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEncryptionAvailable.mockReturnValue(true);
    mockDecryptString.mockImplementation(() => {
      throw new Error("decryption failed");
    });
  });

  describe("SecureStorage.decrypt", () => {
    it("returns decrypted string on success", () => {
      mockDecryptString.mockReturnValueOnce("plain-api-key");

      const result = SecureStorage.decrypt(corruptedBase64);

      expect(result).toBe("plain-api-key");
      expect(result).not.toBe(corruptedBase64);
    });

    it("returns null on failure without throwing or returning ciphertext", () => {
      const result = SecureStorage.decrypt(corruptedBase64);

      expect(result).toBeNull();
      expect(result).not.toBe(corruptedBase64);
    });
  });

  describe("decryptStoredApiKey", () => {
    it("returns null when decrypt fails", () => {
      const result = decryptStoredApiKey(corruptedBase64);

      expect(result).toBeNull();
      expect(result).not.toBe(corruptedBase64);
    });
  });

  describe("getDecryptedCredentialsFromRecord", () => {
    it("returns null when stored key cannot be decrypted", () => {
      const result = getDecryptedCredentialsFromRecord({
        userId: "123",
        encryptedApiKey: corruptedBase64,
      });

      expect(result).toBeNull();
    });

    it("never returns ciphertext as apiKey", () => {
      const result = getDecryptedCredentialsFromRecord({
        userId: "123",
        encryptedApiKey: corruptedBase64,
      });

      expect(result?.apiKey).not.toBe(corruptedBase64);
    });
  });

  describe("hasConfiguredApiKey", () => {
    it("returns true when encrypted key exists but decrypt fails", () => {
      expect(
        hasConfiguredApiKey({
          encryptedApiKey: corruptedBase64,
          credentials: null,
        })
      ).toBe(true);
    });

    it("returns false when no encrypted key and no decrypted api key", () => {
      expect(
        hasConfiguredApiKey({
          encryptedApiKey: "",
          credentials: { userId: "123", apiKey: "" },
        })
      ).toBe(false);
    });

    it("returns true when decrypted api key is non-empty", () => {
      expect(
        hasConfiguredApiKey({
          encryptedApiKey: corruptedBase64,
          credentials: { userId: "123", apiKey: "secret-key" },
        })
      ).toBe(true);
    });
  });

  describe("getDecryptedCredentialsStrict", () => {
    it("throws CredentialDecryptionError with DECRYPT_FAILED when decrypt fails", () => {
      expect(() =>
        getDecryptedCredentialsStrict({
          userId: "123",
          encryptedApiKey: corruptedBase64,
        })
      ).toThrowError(CredentialDecryptionError);

      try {
        getDecryptedCredentialsStrict({
          userId: "123",
          encryptedApiKey: corruptedBase64,
        });
      } catch (error) {
        expect(error).toMatchObject({ code: "DECRYPT_FAILED" });
      }
    });

    it("throws KEYCHAIN_UNAVAILABLE when encryption is unavailable", () => {
      mockIsEncryptionAvailable.mockReturnValue(false);

      try {
        getDecryptedCredentialsStrict({
          userId: "123",
          encryptedApiKey: corruptedBase64,
        });
        expect.fail("expected throw");
      } catch (error) {
        expect(error).toBeInstanceOf(CredentialDecryptionError);
        expect((error as CredentialDecryptionError).code).toBe(
          "KEYCHAIN_UNAVAILABLE"
        );
        expect((error as CredentialDecryptionError).message).not.toBe(
          corruptedBase64
        );
      }
    });
  });
});
