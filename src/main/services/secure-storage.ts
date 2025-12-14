import { safeStorage } from "electron";
import { logger } from "../lib/logger";

/**
 * Encrypts a string using Electron's safeStorage API.
 * @param text - The plaintext string to encrypt
 * @returns A Buffer containing the encrypted data
 * @throws Error if encryption is not available
 */
export function encryptString(text: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    const error = new Error(
      "Encryption is not available. This may occur on Linux systems without a keyring service."
    );
    logger.error("SecureStorage: Encryption not available", error);
    throw error;
  }

  try {
    const encrypted = safeStorage.encryptString(text);
    logger.debug("SecureStorage: String encrypted successfully");
    return encrypted;
  } catch (error) {
    logger.error("SecureStorage: Encryption failed", error);
    throw error;
  }
}

/**
 * Decrypts a Buffer that was encrypted using encryptString.
 * @param encrypted - The encrypted Buffer to decrypt
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails
 */
export function decryptString(encrypted: Buffer): string {
  if (!safeStorage.isEncryptionAvailable()) {
    const error = new Error(
      "Encryption is not available. Cannot decrypt data."
    );
    logger.error(
      "SecureStorage: Encryption not available for decryption",
      error
    );
    throw error;
  }

  try {
    const decrypted = safeStorage.decryptString(encrypted);
    logger.debug("SecureStorage: String decrypted successfully");
    return decrypted;
  } catch (error) {
    logger.error("SecureStorage: Decryption failed", error);
    throw error;
  }
}
