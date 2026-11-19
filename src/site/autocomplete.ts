import * as z from "zod/mini";

import {
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SITE_ORIGIN,
} from "../config/constants";
import { log } from "../log";
import { rememberTagKinds } from "./tag-types";

export const AUTOCOMPLETE_PATH = "/public/autocomplete.php";
export const AUTOCOMPLETE_QUERY_PARAM = "q";
export const AUTOCOMPLETE_MIN_CHARS = 2;
export const AUTOCOMPLETE_DEBOUNCE_MS = 300;
export const AUTOCOMPLETE_TAG_TYPE_ARTIST = "artist";
const HTTP_TOO_MANY_REQUESTS = 429;
const ABORT_ERROR_NAME = "AbortError";

export type AutocompleteSuggestion = {
  readonly label: string;
  readonly value: string;
  readonly type?: string;
};

const AutocompleteItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  type: z.optional(z.nullable(z.string())),
});

const AutocompleteResponseSchema = z.array(AutocompleteItemSchema);

export type AutocompleteQuerierOptions = {
  readonly preferType?: string;
};

export type AutocompleteQuerier = {
  readonly query: (
    text: string,
    onResult: (items: readonly AutocompleteSuggestion[]) => void,
  ) => void;
  readonly cancel: () => void;
};

function buildAutocompleteUrl(query: string): string {
  const params = new URLSearchParams();
  params.set(AUTOCOMPLETE_QUERY_PARAM, query);
  return `${SITE_ORIGIN}${AUTOCOMPLETE_PATH}?${params.toString()}`;
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === ABORT_ERROR_NAME) {
    return true;
  }
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return false;
  }
  return error.name === ABORT_ERROR_NAME;
}

function normalizeItems(
  raw: z.infer<typeof AutocompleteResponseSchema>,
): AutocompleteSuggestion[] {
  // The kinds the site names here colour the chips of these tags elsewhere.
  rememberTagKinds(raw.map((item) => [item.value, item.type ?? undefined]));
  const result: AutocompleteSuggestion[] = [];
  for (const item of raw) {
    const type =
      item.type === null || item.type === undefined ? undefined : item.type;
    if (type === undefined) {
      result.push({ label: item.label, value: item.value });
    } else {
      result.push({ label: item.label, value: item.value, type });
    }
  }
  return result;
}

/** Artists (or another preferred type) first; relative order otherwise preserved. */
export function preferSuggestionType(
  items: readonly AutocompleteSuggestion[],
  preferType: string,
): AutocompleteSuggestion[] {
  const preferred: AutocompleteSuggestion[] = [];
  const rest: AutocompleteSuggestion[] = [];
  for (const item of items) {
    if (item.type === preferType) {
      preferred.push(item);
    } else {
      rest.push(item);
    }
  }
  return [...preferred, ...rest];
}

/**
 * GET /public/autocomplete.php?q=… (site redirects to ac.rule34.xxx).
 * Short queries and failed/429 responses return []. Aborts are silent.
 */
export async function fetchAutocomplete(
  query: string,
  signal?: AbortSignal,
): Promise<AutocompleteSuggestion[]> {
  return (await fetchAutocompleteResult(query, signal)) ?? [];
}

/**
 * The same request, with a failure told from an empty answer: null when the
 * site did not answer (the network, 429, another status, not JSON), a list,
 * empty or not, when it did.
 */
export async function fetchAutocompleteResult(
  query: string,
  signal?: AbortSignal,
): Promise<AutocompleteSuggestion[] | null> {
  const trimmed = query.trim();
  if (trimmed.length < AUTOCOMPLETE_MIN_CHARS) {
    return [];
  }

  let response: Response;
  try {
    const init: RequestInit = {
      method: FETCH_METHOD_GET,
      credentials: FETCH_CREDENTIALS,
    };
    if (signal !== undefined) {
      init.signal = signal;
    }
    response = await fetch(buildAutocompleteUrl(trimmed), init);
  } catch (error) {
    if (isAbortError(error) || signal?.aborted === true) {
      return null;
    }
    log.error("autocomplete: fetch failed", error);
    return null;
  }

  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    log.warn("autocomplete: rate limited", response.status);
    return null;
  }
  if (!response.ok) {
    log.warn("autocomplete: HTTP error", response.status);
    return null;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    if (isAbortError(error) || signal?.aborted === true) {
      return null;
    }
    log.error("autocomplete: invalid JSON", error);
    return null;
  }

  const parsed = AutocompleteResponseSchema.safeParse(json);
  if (!parsed.success) {
    log.error("autocomplete: schema mismatch", parsed.error);
    return null;
  }
  return normalizeItems(parsed.data);
}

/**
 * Debounced autocomplete with AbortController cancellation of the prior request.
 * Queries shorter than {@link AUTOCOMPLETE_MIN_CHARS} resolve to [] without a network call.
 */
export function createAutocompleteQuerier(
  options: AutocompleteQuerierOptions = {},
): AutocompleteQuerier {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;
  const preferType = options.preferType;

  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (controller !== null) {
      controller.abort();
      controller = null;
    }
  };

  const query = (
    text: string,
    onResult: (items: readonly AutocompleteSuggestion[]) => void,
  ): void => {
    cancel();
    const trimmed = text.trim();
    if (trimmed.length < AUTOCOMPLETE_MIN_CHARS) {
      onResult([]);
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      const next = new AbortController();
      controller = next;
      void fetchAutocomplete(trimmed, next.signal).then((items) => {
        if (next.signal.aborted) {
          return;
        }
        if (controller === next) {
          controller = null;
        }
        const ordered =
          preferType === undefined
            ? items
            : preferSuggestionType(items, preferType);
        onResult(ordered);
      });
    }, AUTOCOMPLETE_DEBOUNCE_MS);
  };

  return { query, cancel };
}
