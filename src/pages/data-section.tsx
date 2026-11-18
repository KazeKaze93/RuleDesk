import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  exportBackupDownload,
  importBackupJson,
  IMPORT_MODE_MERGE,
  IMPORT_MODE_REPLACE,
  type BackupImportMode,
  type BackupImportSummary,
} from "../storage/backup";
import { Button, Dialog, SectionLabel, Switch } from "../ui/kit";
import { readFileText } from "../ui/read-file";
import { currentBackupStatus, readLastBackup } from "../storage/history";
import { PANEL_UI_CLASS } from "./constants";
import { markBackupDue } from "./menu";

const SECTION_CLASS = "rdw-data-section";
const ACTIONS_CLASS = "rdw-data-actions";
const HINT_CLASS = "rdw-data-hint";
const BACKUP_PLATE_CLASS = "rdw-data-backup-plate";
const BACKUP_PLATE_TEXT_CLASS = "rdw-data-backup-plate-text";
const BACKUP_MARK_CLASS = "rdw-data-backup-mark";
const BACKUP_MARK = "!";
const BACKUP_DUE_SUFFIX = "Time to export one.";
const IMPORT_CHOICE_CLASS = "rdw-data-import-choice";
const FILE_CLASS = "rdw-data-file";

const HEADING = "Data";
const INCLUDE_BACKGROUND_LABEL = "Include background image";
const INCLUDE_BACKGROUND_ID = "rdw-backup-include-bg";
const INCLUDE_FAVORITES_LABEL = "Include favorites";
const INCLUDE_FAVORITES_ID = "rdw-backup-include-favs";
const FAVORITES_EXPORT_HINT =
  "Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.";
const IMPORT_TITLE = "Import the file";
const IMPORT_MESSAGE =
  "Merge adds the collections, followed artists and marks of the file to the ones here and takes the settings from the file. Replace erases what is here first.";
const IMPORT_MERGE_LABEL = "Merge into current data";
const IMPORT_REPLACE_LABEL = "Replace current data";
const REPLACE_TITLE = "Replace everything?";
const REPLACE_MESSAGE =
  "Collections, followed artists, marks and settings in this browser are erased and the file is put in their place. This cannot be undone. Export first if you are not sure.";
const REPLACE_CONFIRM = "Replace";
const EXPORT_LABEL = UI_TEXT.export;
const IMPORT_LABEL = UI_TEXT.import;
const EXPORT_ERROR_PREFIX = "Export failed:";
const STORAGE_HINT =
  "The file holds collections, followed artists (with covers and post counts) and settings. Blacklist and site theme are browser cookies and are not included.";

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
/* No backup, or an old one, is a warning with its way out in it, not a grey line. */
.${SECTION_CLASS} .${BACKUP_PLATE_CLASS} {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-warn-soft);
  color: var(--rdw-warn);
  font-size: 12px;
}
.${SECTION_CLASS} .${BACKUP_PLATE_TEXT_CLASS} {
  flex: 1 1 200px;
  margin: 0;
}
.${SECTION_CLASS} .${BACKUP_MARK_CLASS} {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 50%;
  font-weight: 700;
  line-height: 1;
}
/* The dialog may be drawn in <body>, out of the section: no parent in the selector. */
.${IMPORT_CHOICE_CLASS} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.${IMPORT_CHOICE_CLASS} p {
  margin: 0;
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

export type DataSectionProps = {
  readonly includeHeading?: boolean;
};

export function DataSection(props: DataSectionProps = {}): JSX.Element {
  const includeHeading = props.includeHeading !== false;
  const fileRef = useRef<HTMLInputElement>(null);
  const [includeBackground, setIncludeBackground] = useState(false);
  const [includeFavorites, setIncludeFavorites] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [backup, setBackup] = useState(() => currentBackupStatus());
  const [neverExported, setNeverExported] = useState(() => readLastBackup() === null);
  // A file chosen in Import, held until the user says what to do with it:
  // Merge or Replace concerns this file only, so it is asked when the file is there.
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  // The same file once "Replace" is picked, held until the user confirms: Replace
  // erases what is in this browser, and a file picked by mistake must not do that.
  const [pendingReplace, setPendingReplace] = useState<string | null>(null);

  const runImport = (text: string, importMode: BackupImportMode): void => {
    void importBackupJson(text, importMode)
      .then((result) => {
        if (!result.ok) {
          setError(`${UI_TEXT.importErrorPrefix} ${result.error}`);
          return;
        }
        setSummary(formatSummary(result.summary));
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Could not read file";
        setError(`${UI_TEXT.importErrorPrefix} ${message}`);
      });
  };

  const exportNow = (): void => {
    setError("");
    setSummary("");
    void exportBackupDownload({ includeBackground, includeFavorites })
      .then(() => {
        setBackup(currentBackupStatus());
        setNeverExported(readLastBackup() === null);
        markBackupDue();
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Export failed unexpectedly";
        setError(`${EXPORT_ERROR_PREFIX} ${message}`);
      });
  };
  const exportButton = (
    // The frequent and harmless one of the two is the main button.
    <Button variant="primary" onClick={exportNow}>
      {EXPORT_LABEL}
    </Button>
  );
  const warned = neverExported || backup.due;

  return (
    <>
      <style>{DATA_SECTION_CSS}</style>
      <section className={`rdw-section ${SECTION_CLASS}`}>
        {includeHeading ? <SectionLabel>{HEADING}</SectionLabel> : null}
        {warned ? (
          <div className={BACKUP_PLATE_CLASS} role="status">
            <span className={BACKUP_MARK_CLASS} aria-hidden="true">
              {BACKUP_MARK}
            </span>
            <p className={BACKUP_PLATE_TEXT_CLASS}>
              {backup.due ? `${backup.text} ${BACKUP_DUE_SUFFIX}` : backup.text}
            </p>
            {exportButton}
          </div>
        ) : (
          <p className={HINT_CLASS}>{backup.text}</p>
        )}
        {/* Rows of the settings page: the switch at the right, as in every other block. */}
        <div className={PANEL_UI_CLASS.settingsGroup}>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={INCLUDE_BACKGROUND_ID}
              label={INCLUDE_BACKGROUND_LABEL}
              checked={includeBackground}
              onChange={setIncludeBackground}
            />
          </div>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={INCLUDE_FAVORITES_ID}
              label={INCLUDE_FAVORITES_LABEL}
              checked={includeFavorites}
              onChange={setIncludeFavorites}
            />
            <p className={PANEL_UI_CLASS.settingsCaption}>{FAVORITES_EXPORT_HINT}</p>
          </div>
        </div>
        <div className={ACTIONS_CLASS}>
          {/* One Export on the screen: while the warning shows, it is the one in it. */}
          {warned ? null : exportButton}
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
                .then((text) => {
                  setPendingImport(text);
                })
                .catch((caught: unknown) => {
                  const message =
                    caught instanceof Error ? caught.message : "Could not read file";
                  setError(`${UI_TEXT.importErrorPrefix} ${message}`);
                });
            }}
          />
        </div>
        {error.length > 0 ? <p className="rdw-error">{error}</p> : null}
        {summary.length > 0 ? <p className="rdw-hint">{summary}</p> : null}
        <p className={HINT_CLASS}>{STORAGE_HINT}</p>
        <Dialog
          open={pendingImport !== null}
          title={IMPORT_TITLE}
          onClose={() => {
            setPendingImport(null);
          }}
        >
          <div className={IMPORT_CHOICE_CLASS}>
            <p>{IMPORT_MESSAGE}</p>
            <Button
              variant="primary"
              onClick={() => {
                const text = pendingImport;
                setPendingImport(null);
                if (text !== null) {
                  runImport(text, IMPORT_MODE_MERGE);
                }
              }}
            >
              {IMPORT_MERGE_LABEL}
            </Button>
            <Button
              variant="danger-quiet"
              onClick={() => {
                // Replace is asked about once more before anything is erased.
                setPendingReplace(pendingImport);
                setPendingImport(null);
              }}
            >
              {IMPORT_REPLACE_LABEL}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPendingImport(null);
              }}
            >
              {UI_TEXT.cancel}
            </Button>
          </div>
        </Dialog>
        <Dialog
          variant="confirm"
          open={pendingReplace !== null}
          title={REPLACE_TITLE}
          message={REPLACE_MESSAGE}
          confirmLabel={REPLACE_CONFIRM}
          cancelLabel={UI_TEXT.cancel}
          confirmTone="danger"
          onConfirm={() => {
            const text = pendingReplace;
            setPendingReplace(null);
            if (text !== null) {
              runImport(text, IMPORT_MODE_REPLACE);
            }
          }}
          onClose={() => {
            setPendingReplace(null);
          }}
        />
      </section>
    </>
  );
}
