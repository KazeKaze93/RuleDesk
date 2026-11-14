import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  EXCLUDE_PREFIX,
  TAG_SEPARATOR,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import {
  createAutocompleteQuerier,
  type AutocompleteSuggestion,
} from "../site/autocomplete";
import { AutocompleteField, type AutocompleteOption } from "./kit";

/** `sort:random`, `score:>=10`, `id:>5`: a filter, not a tag name. */
const FILTER_MARK = ":";
const TRAILING_SPACE = /\s$/;
const LAST_TOKEN = /(\S+)$/;

const SYNTAX_TOKENS: readonly string[] = [
  UPDATES_OR_OPEN,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
];

export type QueryFieldProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly id?: string;
};

type LastToken = {
  /** Text before the token, with its trailing whitespace. */
  readonly head: string;
  /** `-` when the token is an exclusion, otherwise empty. */
  readonly prefix: string;
  /** Tag text being typed, without the exclusion prefix. */
  readonly stem: string;
};

/**
 * The tag the caret is on, taken as the last token of the query.
 * Null when the query ends with whitespace or the token is search syntax
 * (`(`, `)`, `~`) or a filter such as `sort:random`.
 */
export function readLastQueryToken(query: string): LastToken | null {
  if (query.length === 0 || TRAILING_SPACE.test(query)) {
    return null;
  }
  const match = LAST_TOKEN.exec(query);
  const token = match?.[1];
  if (match === null || token === undefined) {
    return null;
  }
  if (SYNTAX_TOKENS.includes(token) || token.includes(FILTER_MARK)) {
    return null;
  }
  const excluded =
    token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length;
  const prefix = excluded ? EXCLUDE_PREFIX : "";
  const stem = token.slice(prefix.length);
  if (stem === EXCLUDE_PREFIX) {
    return null;
  }
  return { head: query.slice(0, match.index), prefix, stem };
}

/** Query with its last token replaced by `tag`, ready for the next token. */
export function completeLastQueryToken(query: string, tag: string): string {
  const last = readLastQueryToken(query);
  if (last === null) {
    return `${query}${tag}${TAG_SEPARATOR}`;
  }
  return `${last.head}${last.prefix}${tag}${TAG_SEPARATOR}`;
}

/**
 * Search-query input with the site tag autocomplete on the token being typed.
 * Requests go out only while the user types, debounced, one at a time
 * (see {@link createAutocompleteQuerier}).
 */
export function QueryField(props: QueryFieldProps): JSX.Element {
  const querierRef = useRef(createAutocompleteQuerier());
  const [suggestions, setSuggestions] = useState<
    readonly AutocompleteSuggestion[]
  >([]);

  useEffect(() => {
    const querier = querierRef.current;
    return (): void => {
      querier.cancel();
    };
  }, []);

  const clearSuggestions = (): void => {
    querierRef.current.cancel();
    setSuggestions([]);
  };

  const onTyped = (value: string): void => {
    props.onChange(value);
    const last = readLastQueryToken(value);
    if (last === null) {
      clearSuggestions();
      return;
    }
    querierRef.current.query(last.stem, setSuggestions);
  };

  const onPicked = (option: AutocompleteOption): void => {
    props.onChange(completeLastQueryToken(props.value, option.value));
    clearSuggestions();
  };

  const optional = {
    ...(props.label === undefined ? {} : { label: props.label }),
    ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
    ...(props.id === undefined ? {} : { id: props.id }),
  };

  return (
    <AutocompleteField
      {...optional}
      value={props.value}
      suggestions={suggestions}
      replaceOnSelect={false}
      onChange={onTyped}
      onSelect={onPicked}
    />
  );
}
