const IPC_INVOKE_PREFIX = /^Error invoking remote method '[^']+':\s*/;

const readStringField = (error: object, key: string): string | undefined => {
  const value = Reflect.get(error, key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

/**
 * Prefer ``Error.message`` from Main (BaseController throws real Error instances).
 * Strip Electron's invoke prefix when present.
 */
export const resolveErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error instanceof Error && error.message) {
    const stripped = error.message.replace(IPC_INVOKE_PREFIX, "").trim();
    if (stripped.length > 0) {
      return stripped;
    }
  }

  if (typeof error === "object" && error !== null) {
    const message = readStringField(error, "message");
    if (message) {
      const nested = message.replace(IPC_INVOKE_PREFIX, "").trim();
      if (nested.length > 0) {
        return nested;
      }
    }

    const code = readStringField(error, "code");
    const name = readStringField(error, "name");
    if (code) {
      return name ? `${name}: ${code}` : `Request failed (${code})`;
    }
  }

  return fallback;
};
