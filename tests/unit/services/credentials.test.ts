import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDb } from "../../helpers/mock-db";
import { settings, SETTINGS_ID } from "@/main/db/schema";
import { encodeTestCredential } from "@/main/lib/test-credential-cipher";
import { getDecryptedApiSettings } from "@/main/services/credentials";

vi.mock("electron", () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    decryptString: () => {
      throw new Error("decryption failed");
    },
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

describe("getDecryptedApiSettings", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  afterEach(() => {
    try {
      mockDb.sqlite.close();
    } catch {
      // ignore
    }
  });

  it("returns null when settings row is missing", async () => {
    const result = await getDecryptedApiSettings(mockDb.db);
    expect(result).toBeNull();
  });

  it("returns null when userId is empty", async () => {
    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "",
        encryptedApiKey: encodeTestCredential("plain-key"),
      })
      .run();

    const result = await getDecryptedApiSettings(mockDb.db);
    expect(result).toBeNull();
  });

  it("returns null when encryptedApiKey is empty", async () => {
    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "123",
        encryptedApiKey: "",
      })
      .run();

    const result = await getDecryptedApiSettings(mockDb.db);
    expect(result).toBeNull();
  });

  it("returns credentials when decryption succeeds", async () => {
    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "123",
        encryptedApiKey: encodeTestCredential("plain-key"),
      })
      .run();

    const result = await getDecryptedApiSettings(mockDb.db);
    expect(result).toEqual({ userId: "123", apiKey: "plain-key" });
  });

  it("returns null when decryption fails", async () => {
    mockDb.db
      .insert(settings)
      .values({
        id: SETTINGS_ID,
        userId: "123",
        encryptedApiKey: Buffer.from("not-a-real-ciphertext").toString("base64"),
      })
      .run();

    const result = await getDecryptedApiSettings(mockDb.db);
    expect(result).toBeNull();
  });
});
