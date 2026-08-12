import axios from "axios";

const CREDENTIAL_QUERY_PARAMS = ["api_key", "user_id", "apiKey", "userId"] as const;
const REDACTED_VALUE = "<redacted>";

export type RedactedLogError = {
  message: string;
  name?: string;
  code?: string;
  status?: number;
  url?: string;
};

/**
 * Redacts credential query params from a URL string.
 * Used before writing HTTP errors to disk logs (app.log).
 */
export function redactCredentialQueryParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const param of CREDENTIAL_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, REDACTED_VALUE);
      }
    }
    return url.toString();
  } catch {
    let result = rawUrl;
    for (const param of CREDENTIAL_QUERY_PARAMS) {
      result = result.replace(
        new RegExp(`([?&]${param}=)[^&]*`, "gi"),
        `$1${REDACTED_VALUE}`
      );
    }
    return result;
  }
}

/**
 * Returns a log-safe summary of an unknown error.
 * Never forwards Axios `config` / full error objects (they embed credentials in URLs).
 */
export function redactErrorForLog(error: unknown): RedactedLogError {
  if (axios.isAxiosError(error)) {
    const rawUrl = error.config?.url;
    return {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.response?.status,
      url:
        typeof rawUrl === "string"
          ? redactCredentialQueryParams(rawUrl)
          : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: String(error),
  };
}
