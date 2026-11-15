import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  clearApiCredentials,
  getApiCredentials,
  setApiCredentials,
} from "../storage/api-credentials";
import { Button, TextField } from "../ui/kit";

/**
 * Settings for the download manager: the user's own API credentials.
 * The manager exists only while they are stored.
 */

const SECTION_CLASS = "rdw-downloads-settings";
const ACTIONS_CLASS = "rdw-downloads-settings-actions";
const HINT_CLASS = "rdw-downloads-settings-hint";

const USER_ID_FIELD_ID = "rdw-api-user-id";
const API_KEY_FIELD_ID = "rdw-api-key";
const USER_ID_LABEL = "User ID";
const API_KEY_LABEL = "API key";
const REMOVE_LABEL = "Remove key";
const OPTIONS_URL = "https://rule34.xxx/index.php?page=account&s=options";
const OPTIONS_LINK_TEXT = "account options page";
const HINT_BEFORE = "The download manager finds files through the site API with your own key. Generate it on the ";
const HINT_AFTER =
  " and paste it here. The key stays in this browser and is not part of the Data export. Without a key there are no download buttons.";
const STATUS_SAVED = "Saved. Download buttons appear on collection pages and under the search panel.";
const STATUS_REMOVED = "Key removed.";
const STATUS_EMPTY = "Enter both the user ID and the API key.";
const STATUS_STORED = "A key is stored.";

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
  const [stored, setStored] = useState(() => getApiCredentials() !== null);
  const [userId, setUserId] = useState(() => getApiCredentials()?.userId ?? "");
  // The stored key is never put back into the field.
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const save = (): void => {
    if (!setApiCredentials(userId, apiKey)) {
      setStatus(STATUS_EMPTY);
      return;
    }
    setApiKey("");
    setStored(true);
    setStatus(STATUS_SAVED);
  };

  const remove = (): void => {
    clearApiCredentials();
    setUserId("");
    setApiKey("");
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
          id={USER_ID_FIELD_ID}
          label={USER_ID_LABEL}
          value={userId}
          onChange={setUserId}
        />
        <TextField
          id={API_KEY_FIELD_ID}
          label={API_KEY_LABEL}
          type="password"
          value={apiKey}
          placeholder={stored ? STATUS_STORED : ""}
          onChange={setApiKey}
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
    </section>
  );
}
