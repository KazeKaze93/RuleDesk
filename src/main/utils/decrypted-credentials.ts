import { safeStorage } from "electron";
import log from "electron-log";
import { SecureStorage } from "../services/secure-storage";

export interface DecryptedCredentials {
  userId: string;
  apiKey: string;
}

export type CredentialErrorCode = "KEYCHAIN_UNAVAILABLE" | "DECRYPT_FAILED";

export class CredentialDecryptionError extends Error {
  public readonly code: CredentialErrorCode;

  constructor(code: CredentialErrorCode, message: string) {
    super(message);
    this.name = "CredentialDecryptionError";
    this.code = code;
  }
}

export const isCredentialDecryptionError = (
  error: unknown
): error is CredentialDecryptionError => {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error instanceof CredentialDecryptionError ||
    error.name === "CredentialDecryptionError"
  );
};

/**
 * Decrypts a stored API key. Never returns raw ciphertext on failure.
 */
export function decryptStoredApiKey(
  encryptedApiKey: string
): string | null {
  if (!encryptedApiKey) {
    return null;
  }

  const decrypted = SecureStorage.decrypt(encryptedApiKey);
  if (decrypted === null) {
    log.warn(
      "[decrypted-credentials] Failed to decrypt API key; refusing to use stored ciphertext"
    );
    return null;
  }

  return decrypted;
}

/**
 * Builds decrypted credentials from a settings row.
 * Returns null when decryption fails for a non-empty stored key.
 */
export function getDecryptedCredentialsFromRecord(record: {
  userId: string | null;
  encryptedApiKey: string | null;
}): DecryptedCredentials | null {
  const userId = record.userId ?? "";
  const storedKey = record.encryptedApiKey ?? "";

  if (!storedKey) {
    return { userId, apiKey: "" };
  }

  const apiKey = decryptStoredApiKey(storedKey);
  if (apiKey === null) {
    return null;
  }

  return { userId, apiKey };
}

/**
 * Whether settings represent a configured API key for gate/routing purposes.
 * A non-empty encrypted key counts even when decrypt fails in the current session.
 */
export function hasConfiguredApiKey(record: {
  encryptedApiKey: string | null;
  credentials: DecryptedCredentials | null;
}): boolean {
  const storedKey = record.encryptedApiKey?.trim() ?? "";
  if (!storedKey) {
    return !!(record.credentials?.apiKey?.trim());
  }
  if (record.credentials === null) {
    return true;
  }
  return !!record.credentials.apiKey.trim();
}

/**
 * Like getDecryptedCredentialsFromRecord but throws CredentialDecryptionError
 * when the OS keychain is unavailable or decryption fails (SyncService path).
 */
export function getDecryptedCredentialsStrict(record: {
  userId: string | null;
  encryptedApiKey: string | null;
}): DecryptedCredentials {
  const userId = record.userId ?? "";
  const storedKey = record.encryptedApiKey ?? "";

  if (!storedKey) {
    return { userId, apiKey: "" };
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new CredentialDecryptionError(
      "KEYCHAIN_UNAVAILABLE",
      "OS keychain unavailable; cannot decrypt API key."
    );
  }

  const apiKey = decryptStoredApiKey(storedKey);
  if (apiKey === null) {
    throw new CredentialDecryptionError(
      "DECRYPT_FAILED",
      "Failed to decrypt API key; credentials may be from another OS user or corrupted."
    );
  }

  return { userId, apiKey };
}
