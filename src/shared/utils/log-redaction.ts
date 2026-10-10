/**
 * Pure log redaction for credentials in query strings / objects and OS user paths.
 * Used by electron-log hooks (main + renderer); call sites must not be the only defense.
 *
 * String mask order (must stay in this order):
 * 1) sensitive query params / object keys (via walk)
 * 2) URL userinfo (login:pass@)
 * 3) home directory → ~
 * 4) OS user path prefixes (Users / home)
 * 5) username as a path segment only (when home context is known)
 */

export const REDACTED_VALUE = "<redacted>" as const;
export const USERNAME_MASK = "<user>" as const;
export const CIRCULAR_PLACEHOLDER = "[Circular]" as const;
export const HOME_TILDE = "~" as const;

/** Query-string parameter names that must never appear with real values in logs. */
export const SENSITIVE_QUERY_PARAMS = [
  "api_key",
  "user_id",
  "apiKey",
  "userId",
] as const;

/** Object keys whose values are replaced wholesale when walking log payloads. */
export const SENSITIVE_OBJECT_KEYS = [
  ...SENSITIVE_QUERY_PARAMS,
  "password",
  "token",
  "authorization",
  "encryptedApiKey",
] as const;

export type RedactionContext = {
  homeDir: string;
  username: string;
};

const SENSITIVE_OBJECT_KEY_SET: ReadonlySet<string> = new Set(
  SENSITIVE_OBJECT_KEYS
);

/** `api_key=…` / `&user_id=…` at start, middle, or end (values may be URL-encoded). */
const SENSITIVE_QUERY_PATTERN = new RegExp(
  `([?&]|^)(${SENSITIVE_QUERY_PARAMS.join("|")})=([^&\\s#]*)`,
  "gi"
);

/** `http://login:pass@host` / `http://login@host` → mask entire userinfo. */
const URL_USERINFO_PATTERN = /\/\/([^/@\s]+)@/g;

/** `C:\Users\<name>` or `C:/Users/<name>` (optional trailing separator). */
const WINDOWS_USERS_PATH_PATTERN =
  /(?:[A-Za-z]:[/\\])Users[/\\][^/\\]+(?=[/\\]|$)/gi;

/** `/Users/<name>` (macOS). */
const MAC_USERS_PATH_PATTERN = /\/Users\/[^/]+(?=\/|$)/g;

/** `/home/<name>` (Linux). */
const LINUX_HOME_PATH_PATTERN = /\/home\/[^/]+(?=\/|$)/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSensitiveObjectKey(key: string): boolean {
  return SENSITIVE_OBJECT_KEY_SET.has(key);
}

function isWalkableObject(value: object): boolean {
  if (Array.isArray(value) || value instanceof Error || value instanceof Date) {
    return false;
  }
  if (value instanceof Map || value instanceof Set) {
    return false;
  }
  if (ArrayBuffer.isView(value)) {
    return false;
  }
  return true;
}

/**
 * Builds redaction context from a home directory path.
 * Username is the last path segment of home (when present).
 */
export function createRedactionContext(homeDir: string): RedactionContext {
  const trimmed = homeDir.trim();
  if (!trimmed) {
    return { homeDir: "", username: "" };
  }
  const normalized = trimmed.replace(/[/\\]+$/, "");
  const segments = normalized.split(/[/\\]/).filter((part) => part.length > 0);
  const username = segments.length > 0 ? segments[segments.length - 1] : "";
  return { homeDir: normalized, username };
}

function redactHomePrefix(input: string, homeDir: string): string {
  if (!homeDir) {
    return input;
  }
  const flexible = escapeRegExp(homeDir).replace(/[/\\]+/g, "[/\\\\]+");
  return input.replace(new RegExp(flexible, "gi"), HOME_TILDE);
}

function redactOsUserPathPrefixes(input: string): string {
  return input
    .replace(WINDOWS_USERS_PATH_PATTERN, HOME_TILDE)
    .replace(MAC_USERS_PATH_PATTERN, HOME_TILDE)
    .replace(LINUX_HOME_PATH_PATTERN, HOME_TILDE);
}

/**
 * Masks URL userinfo (`//user:pass@` / `//user@`) without touching the host.
 */
export function redactUrlUserinfo(input: string): string {
  return input.replace(
    URL_USERINFO_PATTERN,
    `//${REDACTED_VALUE}@`
  );
}

/**
 * Masks the OS username only as a full path segment, and only when home context
 * is known. Never a bare substring — so username "user" cannot corrupt
 * `user_id=…` or the word `users`.
 */
function redactUsernamePathSegments(input: string, context: RedactionContext): string {
  const { homeDir, username } = context;
  if (
    !homeDir ||
    !username ||
    username === HOME_TILDE ||
    username === USERNAME_MASK ||
    username === REDACTED_VALUE
  ) {
    return input;
  }

  // Segment boundaries only: `\name\`, `/name/`, `\name` at end, `/name` at end.
  // Lookahead excludes `user_id` / `users` when username is `user`.
  const pattern = new RegExp(
    `([/\\\\])${escapeRegExp(username)}(?=[/\\\\]|$)`,
    "g"
  );
  return input.replace(pattern, `$1${USERNAME_MASK}`);
}

/**
 * Redacts sensitive query parameters in an arbitrary string (not necessarily a full URL).
 */
export function redactSensitiveQueryInString(input: string): string {
  return input.replace(
    SENSITIVE_QUERY_PATTERN,
    (_match: string, prefix: string, paramName: string): string =>
      `${prefix}${paramName}=${REDACTED_VALUE}`
  );
}

/**
 * Pure string redaction. Order: query keys → userinfo → home → OS prefixes → username segment.
 */
export function redactString(input: string, context: RedactionContext): string {
  let result = redactSensitiveQueryInString(input);
  result = redactUrlUserinfo(result);
  result = redactHomePrefix(result, context.homeDir);
  result = redactOsUserPathPrefixes(result);
  result = redactUsernamePathSegments(result, context);
  return result;
}

function shouldSkipOwnKey(_key: string, value: unknown): boolean {
  return typeof value === "function";
}

function redactOwnProperties(
  source: object,
  context: RedactionContext,
  seen: WeakSet<object>,
  target: Record<string, unknown>
): void {
  for (const key of Object.getOwnPropertyNames(source)) {
    try {
      const value = Reflect.get(source, key);
      if (shouldSkipOwnKey(key, value)) {
        continue;
      }
      if (isSensitiveObjectKey(key)) {
        target[key] = REDACTED_VALUE;
      } else {
        target[key] = redactValue(value, context, seen);
      }
    } catch {
      // Skip properties that throw on access
    }
  }
}

function redactError(
  error: Error,
  context: RedactionContext,
  seen: WeakSet<object>
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    name: error.name,
    message: redactString(error.message, context),
  };

  if (typeof error.stack === "string") {
    result.stack = redactString(error.stack, context);
  }

  // Walk config / request / response (AxiosError) including non-enumerable own keys.
  redactOwnProperties(error, context, seen, result);
  return result;
}

function redactPlainObject(
  value: object,
  context: RedactionContext,
  seen: WeakSet<object>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  redactOwnProperties(value, context, seen, result);
  return result;
}

function redactValue(
  value: unknown,
  context: RedactionContext,
  seen: WeakSet<object>
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (typeof value) {
    case "string":
      return redactString(value, context);
    case "number":
    case "boolean":
    case "bigint":
      return value;
    case "symbol":
    case "function":
      return String(value);
    case "object":
      break;
    default:
      return value;
  }

  if (seen.has(value)) {
    return CIRCULAR_PLACEHOLDER;
  }
  seen.add(value);

  if (value instanceof Error) {
    return redactError(value, context, seen);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, context, seen));
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (!isWalkableObject(value)) {
    try {
      return redactString(String(value), context);
    } catch {
      return REDACTED_VALUE;
    }
  }

  return redactPlainObject(value, context, seen);
}

/**
 * Pure redaction entry point. Returns a redacted copy; never mutates the input.
 */
export function redactForLog(
  value: unknown,
  homeDirOrContext: string | RedactionContext = ""
): unknown {
  const context =
    typeof homeDirOrContext === "string"
      ? createRedactionContext(homeDirOrContext)
      : homeDirOrContext;
  return redactValue(value, context, new WeakSet<object>());
}

/**
 * Redacts every element of a log `data` array (electron-log message payload).
 */
export function redactLogData(
  data: readonly unknown[],
  homeDirOrContext: string | RedactionContext = ""
): unknown[] {
  const context =
    typeof homeDirOrContext === "string"
      ? createRedactionContext(homeDirOrContext)
      : homeDirOrContext;
  return data.map((item) => redactValue(item, context, new WeakSet<object>()));
}
