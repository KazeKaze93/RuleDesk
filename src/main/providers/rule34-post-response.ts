import axios from "axios";
import log from "electron-log";
import {
  RULE34_MISSING_AUTHENTICATION_MARKER,
  RULE34_RESPONSE_BODY_LOG_SNIPPET_CHARS,
} from "../../shared/constants/rule34-api";
import { ProviderSearchError } from "./provider-search-errors";

export type Rule34HttpResponse = {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
};

export function parseRule34RetryAfterMs(
  headers: Record<string, string | string[] | undefined>
): number | undefined {
  const retryAfterHeader = headers["retry-after"];
  const retryAfterRaw = Array.isArray(retryAfterHeader)
    ? retryAfterHeader[0]
    : retryAfterHeader;
  if (typeof retryAfterRaw !== "string") {
    return undefined;
  }
  const retryAfterSeconds = parseInt(retryAfterRaw, 10);
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0) {
    return undefined;
  }
  return retryAfterSeconds * 1000;
}

export function responseIncludesRule34AuthFailure(text: string): boolean {
  return text.includes(RULE34_MISSING_AUTHENTICATION_MARKER);
}

export function assertRule34NotBlockedResponse(
  response: Rule34HttpResponse
): void {
  if (response.status === 429) {
    throw new ProviderSearchError(
      "rate_limit",
      undefined,
      parseRule34RetryAfterMs(response.headers)
    );
  }

  if (responseIncludesRule34AuthFailure(response.text)) {
    throw new ProviderSearchError("auth");
  }
}

export function logRule34ResponseBodySnippet(
  context: string,
  body: string
): void {
  const snippet = body.slice(0, RULE34_RESPONSE_BODY_LOG_SNIPPET_CHARS);
  log.warn(`[Rule34Provider] ${context}: raw body snippet: ${snippet}`);
}

export function isRule34PostsXml(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.includes("<posts") || trimmed.includes("<post ");
}

function isAxiosErrorWithResponse(
  error: unknown
): error is {
  code?: string;
  response: {
    status: number;
    headers: unknown;
    data: unknown;
  };
} {
  return axios.isAxiosError(error) && error.response !== undefined;
}

export function isAxiosTransportFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
    return true;
  }
  return error.response === undefined;
}

function axiosHeadersToRecord(headers: unknown): Record<string, unknown> {
  if (typeof headers !== "object" || headers === null) {
    return {};
  }
  return Object.fromEntries(Object.entries(headers));
}

function normalizeAxiosHeaders(
  headers: Record<string, unknown>
): Record<string, string | string[] | undefined> {
  const normalized: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "string" || Array.isArray(value)) {
      normalized[key] = value;
      continue;
    }
    normalized[key] = String(value);
  }
  return normalized;
}

export function toRule34HttpResponseFromAxiosSuccess(response: {
  status: number;
  headers: unknown;
  data: string;
}): Rule34HttpResponse {
  return {
    status: response.status,
    headers: normalizeAxiosHeaders(axiosHeadersToRecord(response.headers)),
    text: response.data ?? "",
  };
}

export function toRule34HttpResponseFromAxiosError(
  error: unknown
): Rule34HttpResponse | null {
  if (!isAxiosErrorWithResponse(error)) {
    return null;
  }
  const data = error.response.data;
  const text = typeof data === "string" ? data : String(data ?? "");
  return {
    status: error.response.status,
    headers: normalizeAxiosHeaders(axiosHeadersToRecord(error.response.headers)),
    text,
  };
}
