import { chipKindOfTag } from "../ui/tag-chip-kind";
import type { JSX } from "preact";
import { render as preactRender } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import {
  createAutocompleteQuerier,
  type AutocompleteSuggestion,
} from "../site/autocomplete";
import { readSiteBlacklist, writeSiteBlacklist } from "../site/blacklist";
import { AutocompleteField, Button, Chip, SectionLabel } from "../ui/kit";

const SECTION_CLASS = "rdw-blacklist";
const CHIPS_CLASS = "rdw-blacklist-chips";
const ADD_ROW_CLASS = "rdw-blacklist-add-row";
const HINT_CLASS = "rdw-blacklist-hint";

const ADD_LABEL = "Add a tag";
const ADD_BUTTON = "Add";
const PERMANENT_HINT =
  "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.";
const ADD_INPUT_ID = "rdw-blacklist-add";
const TAG_SPLIT_PATTERN = /[, ]+/;

/** Layout CSS for the blacklist section (chips come from kit Chip). */
export const BLACKLIST_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${SECTION_CLASS} .${ADD_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${SECTION_CLASS} .${ADD_ROW_CLASS} .rdw-field,
.${SECTION_CLASS} .${ADD_ROW_CLASS} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
.${SECTION_CLASS} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();

function parseAddTokens(raw: string): string[] {
  const result: string[] = [];
  for (const part of raw.split(TAG_SPLIT_PATTERN)) {
    const trimmed = part.trim();
    if (trimmed.length === 0) {
      continue;
    }
    result.push(trimmed);
  }
  return result;
}

function persistTags(tags: readonly string[]): string[] {
  writeSiteBlacklist([...tags]);
  return readSiteBlacklist();
}

export type BlacklistSectionProps = {
  readonly includeHeading?: boolean;
};

export function BlacklistSection(
  props: BlacklistSectionProps = {},
): JSX.Element {
  const includeHeading = props.includeHeading !== false;
  const [tags, setTags] = useState<string[]>(() => readSiteBlacklist());
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<
    readonly AutocompleteSuggestion[]
  >([]);
  const querierRef = useRef(createAutocompleteQuerier());

  useEffect(() => {
    const querier = querierRef.current;
    return () => {
      querier.cancel();
    };
  }, []);

  const addTokens = useCallback((): void => {
    const tokens = parseAddTokens(draft);
    if (tokens.length === 0) {
      return;
    }
    setTags(persistTags([...readSiteBlacklist(), ...tokens]));
    setDraft("");
    setSuggestions([]);
    querierRef.current.cancel();
  }, [draft]);

  return (
    <>
      <style>{BLACKLIST_SECTION_CSS}</style>
      <section className={`rdw-section ${SECTION_CLASS}`}>
        {includeHeading ? <SectionLabel>Blacklist</SectionLabel> : null}
        <form
          className={ADD_ROW_CLASS}
          onSubmit={(event) => {
            event.preventDefault();
            addTokens();
          }}
        >
          <AutocompleteField
            id={ADD_INPUT_ID}
            label={ADD_LABEL}
            value={draft}
            suggestions={suggestions}
            onChange={(value) => {
              setDraft(value);
              querierRef.current.query(value, setSuggestions);
            }}
            onSelect={() => {
              querierRef.current.cancel();
              setSuggestions([]);
            }}
          />
          <Button type="submit" variant="primary">
            {ADD_BUTTON}
          </Button>
        </form>
        <ul className={CHIPS_CLASS}>
          {tags.map((tag) => (
            <li key={tag}>
              <Chip
                label={tag}
                variant="dot"
                kind={chipKindOfTag(tag)}
                onRemove={() => {
                  const next = readSiteBlacklist().filter(
                    (entry) => entry !== tag,
                  );
                  setTags(persistTags(next));
                }}
              />
            </li>
          ))}
        </ul>
        {/* The list is what one comes for; the note about the cookie is under it. */}
        <p className={HINT_CLASS}>{PERMANENT_HINT}</p>
      </section>
    </>
  );
}

/** Imperative mount for smoke tests and non-Preact callers. */
export function createBlacklistSection(): HTMLElement {
  const root = document.createElement("div");
  preactRender(<BlacklistSection />, root);
  return root;
}
