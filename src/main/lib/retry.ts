import axios from "axios";
import { logger } from "./logger";

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000,
  contextName = "unknown"
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error)) {
        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(
          `SyncService: Retry attempt ${
            attempt + 1
          }/${maxRetries} for ${contextName} after ${delay}ms. Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const status = error.response?.status;
      const isRateLimit = status === 429 || status === 503;
      const isServerError = status !== undefined && status >= 500 && status < 600;
      const isNetworkError = !error.response && error.request;

      const shouldRetry = isRateLimit || isServerError || isNetworkError;
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const retryAfterHeader = error.response?.headers["retry-after"];
      const retryAfter = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : null;
      const waitTime = retryAfter ? Math.max(retryAfter, delay) : delay;

      logger.warn(
        `SyncService: Retry attempt ${
          attempt + 1
        }/${maxRetries} for ${contextName} after ${waitTime}ms. Status: ${
          status || "network error"
        }`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}
