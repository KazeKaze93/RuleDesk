import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  clearApiCredentials,
  hasApiCredentials,
  parseApiCredentials,
  setApiCredentials,
} from "../storage/api-credentials";
import { Button, Select, TextField, type SelectOption } from "../ui/kit";
import {
  DEFAULT_FILE_MASK,
  FILE_MASK_TOKENS,
  buildFileName,
  maskHasToken,
  toggleMaskToken,
} from "../site/download";
import { readFileMask, writeFileMask } from "../storage/download-name";

/**
 * Settings for the download manager: the user's own API credentials.
 * The manager exists only while they are stored.
 *
 * The site shows the credentials as one string, `&api_key=…&user_id=…`.
 * That string is pasted whole into one field and split here.
 */

const SECTION_CLASS = "rdw-downloads-settings";
const ACTIONS_CLASS = "rdw-downloads-settings-actions";
const HINT_CLASS = "rdw-downloads-settings-hint";
const MASK_TOKENS_CLASS = "rdw-downloads-settings-tokens";
const MASK_TOKEN_CLASS = "rdw-downloads-settings-token";

const API_FIELD_ID = "rdw-api-credentials";
const MASK_FIELD_ID = "rdw-download-name";
const MASK_FIELD_LABEL = "File name";
const MASK_SAVED = "Saved.";
const MASK_HINT =
  "Anything typed outside the brackets is kept as it is; the extension is added by itself. Keep id or md5 in the name, or files will share one.";
const MASK_PREVIEW_PREFIX = "Files are saved as: ";
const FOLDER_HINT =
  "Files go to the browser's download folder, each download into a folder named after the collection or the search.";
/** The hash in the made-up file's address. */
const MASK_SAMPLE_HASH = "0f3a9c7b2d1e4f5a6b7c8d9e0f1a2b3c";
/** In the list a hash is cut to its two ends: whole, it pushes the name of the mask out of sight. */
const HASH_END_LENGTH = 4;
const MASK_SAMPLE_HASH_SHORT = `${MASK_SAMPLE_HASH.slice(0, HASH_END_LENGTH)}…${MASK_SAMPLE_HASH.slice(-HASH_END_LENGTH)}`;
/** A made-up post to show what a mask gives. */
const MASK_SAMPLE = {
  postId: 19374686,
  url: `https://wimg.rule34.xxx/images/1234/${MASK_SAMPLE_HASH}.jpg`,
  rating: "explicit",
  score: 42,
  width: 1080,
  height: 1632,
  owner: "uploader",
} as const;
const API_FIELD_LABEL = "API credentials";
const API_FIELD_PLACEHOLDER = "&api_key=…&user_id=…";
const REMOVE_LABEL = "Remove key";
const OPTIONS_URL = "https://rule34.xxx/index.php?page=account&s=options";
const OPTIONS_LINK_TEXT = "account options page";
const HINT_BEFORE =
  "The download manager finds files through the site API with your own key. Generate it on the ";
const HINT_AFTER =
  ", copy the whole line it shows and paste it here. The key stays in this browser and is not part of the Data export. Without a key there are no download buttons.";
const STATUS_SAVED = "Saved. Download buttons appear on collection pages and under the search panel.";
const STATUS_REMOVED = "Key removed.";
const STATUS_INVALID = "Paste the whole line from the site: it must hold both api_key and user_id.";
const STATUS_STORED = "A key is stored. Paste a new line to replace it.";

export const DOWNLOADS_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.${SECTION_CLASS} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${SECTION_CLASS} .${HINT_CLASS} a {
  color: var(--rdw-accent);
}
.${MASK_TOKENS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
}
.${MASK_TOKEN_CLASS} {
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: 12px;
  background: var(--rdw-surface-2);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: pointer;
}
.${MASK_TOKEN_CLASS}:hover {
  border-color: var(--rdw-accent);
}
.${MASK_TOKEN_CLASS}[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
}
`.trim();

/**
 * Ready masks to pick from, each named by what it is made of; anything else
 * is "Custom".
 */
const MASK_PRESET_LIST = [
  { mask: DEFAULT_FILE_MASK, name: "Site + ID" },
  { mask: "[id]", name: "ID" },
  { mask: "[md5]", name: "MD5 hash" },
  { mask: "[date] [id]", name: "Date + ID" },
  { mask: "[id] [width]x[height]", name: "ID + size" },
  { mask: "[rating] [id]", name: "Rating + ID" },
  { mask: "[owner] [id]", name: "Uploader + ID" },
] as const;
export const MASK_PRESETS: readonly string[] = MASK_PRESET_LIST.map((preset) => preset.mask);
const MASK_CUSTOM = "custom";
const MASK_CUSTOM_LABEL = "Custom…";
const MASK_TOKENS_LABEL = "In the name:";
const MASK_NAME_SEPARATOR = " — ";

function sample(mask: string): string {
  return buildFileName(mask, MASK_SAMPLE);
}

/**
 * A row of the list: the name of the mask, then what it gives on one post.
 * The example alone read as a list of random file names.
 */
function presetLabel(name: string, mask: string): string {
  const example = sample(mask).replace(MASK_SAMPLE_HASH, MASK_SAMPLE_HASH_SHORT);
  return `${name}${MASK_NAME_SEPARATOR}${example}`;
}

/**
 * The name saved files get, for the manager and for the button of a post
 * alike. A ready mask is picked from the list and saved at once; "Custom…"
 * opens a field, where a click on a token adds it to the name.
 */
function FileNameSetting(): JSX.Element {
  const [mask, setMask] = useState(() => readFileMask());
  const [custom, setCustom] = useState(() => !MASK_PRESETS.includes(readFileMask()));
  const [saved, setSaved] = useState(false);
  const store = (value: string): void => {
    writeFileMask(value);
    setMask(readFileMask());
    setSaved(true);
  };
  // "Custom…" is first: as the last of eight it was under the fold of the list.
  const options: SelectOption[] = [
    { value: MASK_CUSTOM, label: MASK_CUSTOM_LABEL },
    ...MASK_PRESET_LIST.map((preset) => ({
      value: preset.mask,
      label: presetLabel(preset.name, preset.mask),
    })),
  ];
  return (
    <form
      className={SECTION_CLASS}
      onSubmit={(event) => {
        event.preventDefault();
        store(mask);
      }}
    >
      <Select
        label={MASK_FIELD_LABEL}
        options={options}
        value={custom ? MASK_CUSTOM : mask}
        onChange={(value) => {
          if (value === MASK_CUSTOM) {
            setCustom(true);
            setSaved(false);
            return;
          }
          setCustom(false);
          store(value);
        }}
      />
      {custom ? (
        <>
          <TextField
            id={MASK_FIELD_ID}
            value={mask}
            placeholder={DEFAULT_FILE_MASK}
            aria-label={MASK_FIELD_LABEL}
            onChange={(value) => {
              setMask(value);
              setSaved(false);
            }}
          />
          <div className={MASK_TOKENS_CLASS}>
            <span className={HINT_CLASS}>{MASK_TOKENS_LABEL}</span>
            {FILE_MASK_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                className={`${MASK_TOKEN_CLASS} rdw-kit-focusable`}
                aria-pressed={maskHasToken(mask, token)}
                onClick={() => {
                  // A switch: a token is in the name once or not at all.
                  setMask(toggleMaskToken(mask, token));
                  setSaved(false);
                }}
              >
                {token}
              </button>
            ))}
          </div>
          <div className={ACTIONS_CLASS}>
            <Button type="submit" variant="primary" size="s">
              {UI_TEXT.save}
            </Button>
          </div>
          <p className={HINT_CLASS}>{MASK_HINT}</p>
        </>
      ) : null}
      {/* A ready mask shows its example in the list itself; only a name built
          from parts needs the line. */}
      {custom || saved ? (
        <p className={HINT_CLASS} role="status">
          {[custom ? `${MASK_PREVIEW_PREFIX}${sample(mask)}` : "", saved ? MASK_SAVED : ""]
            .filter((part) => part.length > 0)
            .join(" ")}
        </p>
      ) : null}
      <p className={HINT_CLASS}>{FOLDER_HINT}</p>
    </form>
  );
}

export function DownloadsSection(): JSX.Element {
  const [stored, setStored] = useState(() => hasApiCredentials());
  // The stored key is never put back into the field.
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");

  const save = (): void => {
    const parsed = parseApiCredentials(draft);
    if (parsed === null || !setApiCredentials(parsed.userId, parsed.apiKey)) {
      setStatus(STATUS_INVALID);
      return;
    }
    setDraft("");
    setStored(true);
    setStatus(STATUS_SAVED);
  };

  const remove = (): void => {
    clearApiCredentials();
    setDraft("");
    setStored(false);
    setStatus(STATUS_REMOVED);
  };

  return (
    <section className={`rdw-section ${SECTION_CLASS}`}>
      <style>{DOWNLOADS_SECTION_CSS}</style>
      <form
        className={SECTION_CLASS}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <TextField
          id={API_FIELD_ID}
          label={API_FIELD_LABEL}
          type="password"
          value={draft}
          placeholder={stored ? STATUS_STORED : API_FIELD_PLACEHOLDER}
          onChange={(value) => {
            setDraft(value);
            setStatus("");
          }}
        />
        <p className={HINT_CLASS}>
          {HINT_BEFORE}
          <a href={OPTIONS_URL} target="_blank" rel="noopener">
            {OPTIONS_LINK_TEXT}
          </a>
          {HINT_AFTER}
        </p>
        <div className={ACTIONS_CLASS}>
          {/* Nothing to save while nothing is typed: the stored key is not in the field. */}
          <Button type="submit" variant="primary" size="s" disabled={draft.trim().length === 0}>
            {UI_TEXT.save}
          </Button>
          {stored ? (
            <Button type="button" variant="secondary" size="s" onClick={remove}>
              {REMOVE_LABEL}
            </Button>
          ) : null}
        </div>
      </form>
      {status.length > 0 ? (
        <p className={HINT_CLASS} role="status">
          {status}
        </p>
      ) : null}
      <FileNameSetting />
    </section>
  );
}
