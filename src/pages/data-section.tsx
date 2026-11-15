import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  backupDateStamp,
  downloadBackupText,
  exportBackupDownload,
  importBackupJson,
  IMPORT_MODE_MERGE,
  IMPORT_MODE_REPLACE,
  type BackupImportMode,
  type BackupImportSummary,
} from "../storage/backup";
import { addArtists, listArtistTags } from "../storage/store";
import {
  Button,
  SectionLabel,
  Segmented,
  Switch,
} from "../ui/kit";

const SECTION_CLASS = "rdw-data-section";
const ACTIONS_CLASS = "rdw-data-actions";
const HINT_CLASS = "rdw-data-hint";
const FILE_CLASS = "rdw-data-file";

const HEADING = "Data";
const INCLUDE_BACKGROUND_LABEL = "Include background image";
const INCLUDE_BACKGROUND_ID = "rdw-backup-include-bg";
const INCLUDE_FAVORITES_LABEL = "Include favorites";
const INCLUDE_FAVORITES_ID = "rdw-backup-include-favs";
const FAVORITES_EXPORT_HINT =
  "Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.";
const IMPORT_MODE_LABEL = "Import mode";
const EXPORT_LABEL = UI_TEXT.export;
const IMPORT_LABEL = UI_TEXT.import;
const EXPORT_ERROR_PREFIX = "Export failed:";
const STORAGE_HINT =
  "Collections, artists, and settings live in Tampermonkey storage. Favorites are optional in this file. Blacklist and site theme are browser cookies and are not included.";

const ARTISTS_HEADING = "Followed artists";
const ARTISTS_EXPORT_LABEL = "Export artists";
const ARTISTS_IMPORT_LABEL = "Import artists";
const ARTISTS_HINT =
  "A text file with one artist tag per line. Import follows the tags you do not follow yet. Covers and post counts travel only with the full export above.";
const ARTISTS_FILE_PREFIX = "ruledesk-artists-";
const ARTISTS_FILE_SUFFIX = ".txt";
const ARTISTS_MIME = "text/plain";
const ARTISTS_ACCEPT = "text/plain,.txt";
const ARTISTS_EMPTY_MESSAGE = "No followed artists to export.";
const LINE_BREAK = "\n";
const TAG_SPLIT = /\s+/;

const MODE_OPTIONS = [
  { value: IMPORT_MODE_MERGE, label: "Merge" },
  { value: IMPORT_MODE_REPLACE, label: "Replace" },
] as const;

export const DATA_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${SECTION_CLASS} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${SECTION_CLASS} .${FILE_CLASS} {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`.trim();

function formatSummary(summary: BackupImportSummary): string {
  return `Imported ${String(summary.artistCount)} artists, ${String(summary.collectionCount)} collections, ${String(summary.favCount)} favorites.`;
}

/** Followed artist tags as text, one per line, in name order. */
export function artistsExportText(tags: readonly string[]): string {
  const sorted = [...tags].sort((a, b) => a.localeCompare(b));
  return `${sorted.join(LINE_BREAK)}${LINE_BREAK}`;
}

function artistsImportSummary(result: {
  readonly added: number;
  readonly duplicates: number;
  readonly invalid: number;
}): string {
  return `Followed ${String(result.added)} new artists, already followed ${String(result.duplicates)}, invalid ${String(result.invalid)}.`;
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read file"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Could not read file"));
    };
    reader.readAsText(file);
  });
}

export type DataSectionProps = {
  readonly includeHeading?: boolean;
};

export function DataSection(props: DataSectionProps = {}): JSX.Element {
  const includeHeading = props.includeHeading !== false;
  const fileRef = useRef<HTMLInputElement>(null);
  const artistsFileRef = useRef<HTMLInputElement>(null);
  const [artistsError, setArtistsError] = useState("");
  const [artistsSummary, setArtistsSummary] = useState("");
  const [includeBackground, setIncludeBackground] = useState(false);
  const [includeFavorites, setIncludeFavorites] = useState(false);
  const [mode, setMode] = useState<BackupImportMode>(IMPORT_MODE_MERGE);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  return (
    <>
      <style>{DATA_SECTION_CSS}</style>
      <section className={`rdw-section ${SECTION_CLASS}`}>
        {includeHeading ? <SectionLabel>{HEADING}</SectionLabel> : null}
        <Switch
          id={INCLUDE_BACKGROUND_ID}
          label={INCLUDE_BACKGROUND_LABEL}
          checked={includeBackground}
          onChange={setIncludeBackground}
        />
        <Switch
          id={INCLUDE_FAVORITES_ID}
          label={INCLUDE_FAVORITES_LABEL}
          checked={includeFavorites}
          onChange={setIncludeFavorites}
        />
        <p className={HINT_CLASS}>{FAVORITES_EXPORT_HINT}</p>
        <Segmented
          label={IMPORT_MODE_LABEL}
          options={[...MODE_OPTIONS]}
          value={mode}
          onChange={(value) => {
            if (
              value === IMPORT_MODE_MERGE ||
              value === IMPORT_MODE_REPLACE
            ) {
              setMode(value);
            }
          }}
        />
        <div className={ACTIONS_CLASS}>
          <Button
            variant="secondary"
            onClick={() => {
              setError("");
              setSummary("");
              void exportBackupDownload({
                includeBackground,
                includeFavorites,
              }).catch((caught: unknown) => {
                const message =
                  caught instanceof Error
                    ? caught.message
                    : "Export failed unexpectedly";
                setError(`${EXPORT_ERROR_PREFIX} ${message}`);
              });
            }}
          >
            {EXPORT_LABEL}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            {IMPORT_LABEL}
          </Button>
          <input
            ref={fileRef}
            className={FILE_CLASS}
            type="file"
            accept="application/json,.json"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file === undefined) {
                return;
              }
              setError("");
              setSummary("");
              void readFileText(file)
                .then((text) => importBackupJson(text, mode))
                .then((result) => {
                  if (!result.ok) {
                    setError(`${UI_TEXT.importErrorPrefix} ${result.error}`);
                    return;
                  }
                  setSummary(formatSummary(result.summary));
                })
                .catch((caught: unknown) => {
                  const message =
                    caught instanceof Error
                      ? caught.message
                      : "Could not read file";
                  setError(`${UI_TEXT.importErrorPrefix} ${message}`);
                });
            }}
          />
        </div>
        {error.length > 0 ? <p className="rdw-error">{error}</p> : null}
        {summary.length > 0 ? <p className="rdw-hint">{summary}</p> : null}
        <p className={HINT_CLASS}>{STORAGE_HINT}</p>
      </section>
      <section className={`rdw-section ${SECTION_CLASS}`}>
        <SectionLabel>{ARTISTS_HEADING}</SectionLabel>
        <div className={ACTIONS_CLASS}>
          <Button
            variant="secondary"
            onClick={() => {
              setArtistsSummary("");
              const tags = listArtistTags();
              if (tags.length === 0) {
                setArtistsError(ARTISTS_EMPTY_MESSAGE);
                return;
              }
              setArtistsError("");
              downloadBackupText(
                artistsExportText(tags),
                `${ARTISTS_FILE_PREFIX}${backupDateStamp()}${ARTISTS_FILE_SUFFIX}`,
                ARTISTS_MIME,
              );
            }}
          >
            {ARTISTS_EXPORT_LABEL}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              artistsFileRef.current?.click();
            }}
          >
            {ARTISTS_IMPORT_LABEL}
          </Button>
          <input
            ref={artistsFileRef}
            className={FILE_CLASS}
            type="file"
            accept={ARTISTS_ACCEPT}
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file === undefined) {
                return;
              }
              setArtistsError("");
              setArtistsSummary("");
              void readFileText(file)
                .then((text) => {
                  const tags = text.split(TAG_SPLIT).filter((tag) => tag.length > 0);
                  setArtistsSummary(artistsImportSummary(addArtists(tags)));
                })
                .catch((caught: unknown) => {
                  const message =
                    caught instanceof Error ? caught.message : "Could not read file";
                  setArtistsError(`${UI_TEXT.importErrorPrefix} ${message}`);
                });
            }}
          />
        </div>
        {artistsError.length > 0 ? <p className="rdw-error">{artistsError}</p> : null}
        {artistsSummary.length > 0 ? (
          <p className="rdw-hint">{artistsSummary}</p>
        ) : null}
        <p className={HINT_CLASS}>{ARTISTS_HINT}</p>
      </section>
    </>
  );
}
