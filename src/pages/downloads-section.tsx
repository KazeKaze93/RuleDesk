import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  clearApiCredentials,
  hasApiCredentials,
  parseApiCredentials,
  setApiCredentials,
} from "../storage/api-credentials";
import {
  getDownloadBaseFolder,
  setDownloadBaseFolder,
} from "../storage/download-settings";
import { Button, TextField } from "../ui/kit";

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
const API_FIELD_LABEL = "API credentials";
const API_FIELD_PLACEHOLDER = "&api_key=…&user_id=…";
const REMOVE_LABEL = "Remove key";
const FOLDER_FIELD_ID = "rdw-download-folder";
const FOLDER_FIELD_LABEL = "Download folder";
const FOLDER_PLACEHOLDER = "empty: straight into the browser's download folder";
const FOLDER_SAVED = "Folder saved.";
const FOLDER_HINT =
  "A folder inside the browser's download folder, for example art/rule34. Each download gets its own subfolder there, named after the collection or the search. A script cannot save outside the browser's download folder; to move everything elsewhere, change that folder in the browser's settings.";
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
`.trim();

export function DownloadsSection(): JSX.Element {
  const [stored, setStored] = useState(() => hasApiCredentials());
  // The stored key is never put back into the field.
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [folder, setFolder] = useState(() => getDownloadBaseFolder());
  const [folderStatus, setFolderStatus] = useState("");

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
      <form
        className={SECTION_CLASS}
        onSubmit={(event) => {
          event.preventDefault();
          setFolder(setDownloadBaseFolder(folder));
          setFolderStatus(FOLDER_SAVED);
        }}
      >
        <TextField
          id={FOLDER_FIELD_ID}
          label={FOLDER_FIELD_LABEL}
          value={folder}
          placeholder={FOLDER_PLACEHOLDER}
          onChange={(value) => {
            setFolder(value);
            setFolderStatus("");
          }}
        />
        <div className={ACTIONS_CLASS}>
          <Button type="submit" variant="secondary" size="s">
            {UI_TEXT.save}
          </Button>
        </div>
      </form>
      {folderStatus.length > 0 ? (
        <p className={HINT_CLASS} role="status">
          {folderStatus}
        </p>
      ) : null}
      <p className={HINT_CLASS}>{FOLDER_HINT}</p>
      <p className={HINT_CLASS}>
        {HINT_BEFORE}
        <a href={OPTIONS_URL} target="_blank" rel="noopener">
          {OPTIONS_LINK_TEXT}
        </a>
        {HINT_AFTER}
      </p>
    </section>
  );
}
