import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  clearApiCredentials,
  hasApiCredentials,
  parseApiCredentials,
  setApiCredentials,
} from "../storage/api-credentials";
import { Button, TextField } from "../ui/kit";
import { DEFAULT_FILE_MASK, FILE_MASK_TOKENS, buildFileName } from "../site/download";
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

const API_FIELD_ID = "rdw-api-credentials";
const MASK_FIELD_ID = "rdw-download-name";
const MASK_FIELD_LABEL = "File name";
const MASK_SAVED = "Saved.";
const MASK_RESET_LABEL = "Default";
const MASK_HINT_PREFIX = "What you can put in square brackets: ";
const MASK_HINT_SUFFIX =
  ". Anything else is kept as typed; the extension is added by itself. Keep [id] or [md5] in the name, or files will share one.";
const MASK_PREVIEW_PREFIX = "For example: ";
/** A made-up post to show what a mask gives. */
const MASK_SAMPLE = {
  postId: 19374686,
  url: "https://wimg.rule34.xxx/images/1234/0f3a9c7b2d1e4f5a6b7c8d9e0f1a2b3c.jpg",
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
  ", copy the whole line it shows and paste it here. The key stays in this browser and is not part of the Data export. Without a key there are no download buttons. Files go to the browser's download folder, each download into a folder named after the collection or the search.";
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
`.trim();

/** The setting of the name saved files get, for the manager and for a single post alike. */
function FileNameSetting(): JSX.Element {
  const [mask, setMask] = useState(() => readFileMask());
  const [saved, setSaved] = useState(false);
  const store = (value: string): void => {
    writeFileMask(value);
    setMask(readFileMask());
    setSaved(true);
  };
  return (
    <form
      className={SECTION_CLASS}
      onSubmit={(event) => {
        event.preventDefault();
        store(mask);
      }}
    >
      <TextField
        id={MASK_FIELD_ID}
        label={MASK_FIELD_LABEL}
        value={mask}
        placeholder={DEFAULT_FILE_MASK}
        onChange={(value) => {
          setMask(value);
          setSaved(false);
        }}
      />
      <div className={ACTIONS_CLASS}>
        <Button type="submit" variant="primary" size="s">
          {UI_TEXT.save}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="s"
          onClick={() => {
            store(DEFAULT_FILE_MASK);
          }}
        >
          {MASK_RESET_LABEL}
        </Button>
      </div>
      <p className={HINT_CLASS} role="status">
        {`${MASK_PREVIEW_PREFIX}${buildFileName(mask, MASK_SAMPLE)}${saved ? ` ${MASK_SAVED}` : ""}`}
      </p>
      <p className={HINT_CLASS}>
        {`${MASK_HINT_PREFIX}${FILE_MASK_TOKENS.map((token) => `[${token}]`).join(", ")}${MASK_HINT_SUFFIX}`}
      </p>
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
        <div className={ACTIONS_CLASS}>
          <Button type="submit" variant="primary" size="s">
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
      <p className={HINT_CLASS}>
        {HINT_BEFORE}
        <a href={OPTIONS_URL} target="_blank" rel="noopener">
          {OPTIONS_LINK_TEXT}
        </a>
        {HINT_AFTER}
      </p>
      <FileNameSetting />
    </section>
  );
}
