export const TEST_CREDENTIAL_CIPHER_PREFIX = "rd-test:v1:";

export function isTestRuntime(): boolean {
  return process.env.NODE_ENV === "test";
}

export function encodeTestCredential(plainText: string): string {
  return (
    TEST_CREDENTIAL_CIPHER_PREFIX +
    Buffer.from(plainText, "utf8").toString("base64")
  );
}

export function isTestEncodedCredential(encoded: string): boolean {
  return encoded.startsWith(TEST_CREDENTIAL_CIPHER_PREFIX);
}

export function decodeTestCredential(encoded: string): string | null {
  if (!isTestEncodedCredential(encoded)) {
    return null;
  }
  try {
    return Buffer.from(
      encoded.slice(TEST_CREDENTIAL_CIPHER_PREFIX.length),
      "base64"
    ).toString("utf8");
  } catch {
    return null;
  }
}
