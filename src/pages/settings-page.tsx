import type { ComponentChildren, JSX } from "preact";
import { Fragment, render as preactRender } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import { FEATURES } from "../features/registry";
import {
  applyCssOnlyFeatureChoice,
  applyCssOnlyFeatureEnabled,
  getFeatureChoice,
  isFeatureEnabled,
} from "../features/runtime";
import {
  getGridFavButtonsEnabled,
  getPlaylistChunkSize,
  getTweaksEnabled,
  getUpdatesGroupSize,
  setFeatureChoiceValue,
  clearFeatureState,
  getFeatureEnabled,
  getFeatureState,
  setFeatureEnabled,
  setFeatureState,
  setGridFavButtonsEnabled,
  setPlaylistChunkSize,
  setTweaksEnabled,
  setUpdatesGroupSize,
} from "../storage/store";
import { AppearanceSection } from "../ui/appearance-section";
import { setGridFavButtonsVisible } from "../ui/cards";
import { Card, NumberField, Select, Switch } from "../ui/kit";
import { IconChevronDown, IconChevronRight } from "../ui/kit/icons";
import { BlacklistSection } from "./blacklist-section";
import {
  FEATURE_CHECKBOX_ID_PREFIX,
  FEATURE_CHOICE_ID_PREFIX,
  featurePanelLabel,
  GRID_FAV_CHECKBOX_ID,
  PANEL_UI_CLASS,
  PLAYLIST_CHUNK_SIZE_ID,
  STATS_MENU_SETTING_ID,
  STATS_MENU_SETTING_LABEL,
  STATS_MENU_SWITCH_ID,
  TWEAKS_SWITCH_ID,
  UPDATES_GROUP_SIZE_ID,
} from "./constants";
import { DataSection } from "./data-section";
import { DownloadsSection } from "./downloads-section";
import { FavoritesSyncSection } from "./favorites-sync-section";
import {
  STICKY_HEADER_DEFAULT,
  STICKY_HEADER_SETTING_ID,
  STICKY_HEADER_SETTING_LABEL,
  STICKY_HEADER_SWITCH_ID,
  applyStickyHeader,
} from "../boot/sticky-header";
import { installSiteMenu } from "./menu";

/** Grid density is owned by Appearance; omit from Page module list. */
const PAGE_FEATURE_SKIP = new Set(["grid-density"]);

/**
 * AppearanceSection injects its own zebra; this late style (after the section)
 * clears it for all themes so the Grid row matches flat settings cards.
 * appearance-section.tsx is out of Package F ownership.
 */
const APPEARANCE_ROW_CLASS = "rdw-appearance__row";
const APPEARANCE_FLAT_ROWS_CSS = `
.${APPEARANCE_ROW_CLASS}:nth-child(even) {
  background: transparent;
}
`.trim();

const SECTION_CLASS = "rdw-settings-section";
const SECTION_HEADER_CLASS = "rdw-settings-section-header";
const SECTION_BODY_CLASS = "rdw-settings-section-body";
const SECTION_ID_ATTR = "data-settings-section";
const CHEVRON_PX = 14;

/** Saved under featureState: which settings blocks are collapsed. */
const SECTIONS_STATE_ID = "settings-sections";

const SECTION_APPEARANCE = "appearance";
const SECTION_PAGE = "page";
const SECTION_BLACKLIST = "blacklist";
const SECTION_FAVORITES = "favorites";
const SECTION_DOWNLOADS = "downloads";
const SECTION_DATA = "data";

const SECTION_TITLES: Readonly<Record<string, string>> = {
  [SECTION_APPEARANCE]: "Appearance",
  [SECTION_PAGE]: "Page",
  [SECTION_BLACKLIST]: "Blacklist",
  [SECTION_FAVORITES]: "Favorites",
  [SECTION_DOWNLOADS]: "Downloads",
  [SECTION_DATA]: "Data",
};

export const SETTINGS_SECTION_CSS = `
.${SECTION_HEADER_CLASS} {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rdw-muted);
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
}
.${SECTION_HEADER_CLASS}:hover {
  color: var(--rdw-text);
}
.${SECTION_BODY_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${SECTION_BODY_CLASS}[hidden] {
  display: none;
}
`.trim();

function readCollapsedSections(): string[] {
  const raw = getFeatureState(SECTIONS_STATE_ID);
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item in SECTION_TITLES) {
      ids.push(item);
    }
  }
  return ids;
}

/**
 * One settings block that folds to its title. The body stays mounted while
 * folded, so a running favorites sync or a typed value is not lost.
 */
function SettingsSection(props: {
  readonly id: string;
  readonly collapsed: boolean;
  readonly onToggle: (id: string) => void;
  readonly children: ComponentChildren;
}): JSX.Element {
  const bodyId = `${SECTION_CLASS}-${props.id}`;
  return (
    <Card className={`${PANEL_UI_CLASS.pageCard} ${SECTION_CLASS}`}>
      <button
        type="button"
        className={`${SECTION_HEADER_CLASS} rdw-kit-focusable`}
        aria-expanded={!props.collapsed}
        aria-controls={bodyId}
        {...{ [SECTION_ID_ATTR]: props.id }}
        onClick={() => {
          props.onToggle(props.id);
        }}
      >
        {props.collapsed ? (
          <IconChevronRight size={CHEVRON_PX} />
        ) : (
          <IconChevronDown size={CHEVRON_PX} />
        )}
        {SECTION_TITLES[props.id] ?? props.id}
      </button>
      <div id={bodyId} className={SECTION_BODY_CLASS} hidden={props.collapsed}>
        {props.children}
      </div>
    </Card>
  );
}

function FeatureModules(): JSX.Element {
  const [, bump] = useState(0);
  const refresh = (): void => {
    bump((value) => value + 1);
  };

  return (
    <div className={PANEL_UI_CLASS.settingsGroup}>
      {FEATURES.filter((feature) => !PAGE_FEATURE_SKIP.has(feature.id)).map(
        (feature) => {
          const label = featurePanelLabel(feature.id, feature.label);
          const choice = feature.choice;
          return (
            <Fragment key={feature.id}>
              <div className={PANEL_UI_CLASS.settingsRow}>
                <Switch
                  id={`${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`}
                  label={label}
                  checked={isFeatureEnabled(feature.id)}
                  onChange={(checked) => {
                    setFeatureEnabled(feature.id, checked);
                    if (feature.resetStateOnToggle === true) {
                      clearFeatureState(feature.id);
                    }
                    if (feature.cssOnly === true) {
                      applyCssOnlyFeatureEnabled(feature.id, checked);
                      refresh();
                      return;
                    }
                    window.location.reload();
                  }}
                />
                {feature.settingsCaption !== undefined ? (
                  <p className={PANEL_UI_CLASS.settingsCaption}>
                    {feature.settingsCaption}
                  </p>
                ) : null}
              </div>
              {choice !== undefined ? (
                <div
                  className={`${PANEL_UI_CLASS.settingsRow} ${PANEL_UI_CLASS.settingsRowSub}`}
                  id={`${FEATURE_CHOICE_ID_PREFIX}${feature.id}`}
                >
                  <Select
                    label={choice.label ?? label}
                    options={choice.options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    value={getFeatureChoice(feature.id)}
                    onChange={(value) => {
                      setFeatureChoiceValue(feature.id, value);
                      if (feature.cssOnly === true) {
                        applyCssOnlyFeatureChoice(feature.id, value);
                        refresh();
                        return;
                      }
                      window.location.reload();
                    }}
                  />
                </div>
              ) : null}
            </Fragment>
          );
        },
      )}
    </div>
  );
}

export function SettingsPage(): JSX.Element {
  const [tweaks, setTweaks] = useState(() => getTweaksEnabled());
  const [updatesGroup, setUpdatesGroup] = useState(() => getUpdatesGroupSize());
  const [playlistChunk, setPlaylistChunk] = useState(() =>
    getPlaylistChunkSize(),
  );
  const [gridFavEnabled, setGridFavEnabled] = useState(() =>
    getGridFavButtonsEnabled(),
  );
  const [statsMenu, setStatsMenu] = useState(() =>
    getFeatureEnabled(STATS_MENU_SETTING_ID, true),
  );

  const [stickyHeader, setStickyHeader] = useState(() =>
    getFeatureEnabled(STICKY_HEADER_SETTING_ID, STICKY_HEADER_DEFAULT),
  );

  const [collapsed, setCollapsed] = useState<string[]>(() =>
    readCollapsedSections(),
  );
  const toggleSection = (id: string): void => {
    const next = collapsed.includes(id)
      ? collapsed.filter((entry) => entry !== id)
      : [...collapsed, id];
    setFeatureState(SECTIONS_STATE_ID, next);
    setCollapsed(next);
  };
  const section = (id: string): { id: string; collapsed: boolean; onToggle: (id: string) => void } => ({
    id,
    collapsed: collapsed.includes(id),
    onToggle: toggleSection,
  });

  return (
    <div className={PANEL_UI_CLASS.scrollRegion}>
      <style>{SETTINGS_SECTION_CSS}</style>
      <SettingsSection {...section(SECTION_APPEARANCE)}>
        <AppearanceSection includeHeading={false} />
        <style>{APPEARANCE_FLAT_ROWS_CSS}</style>
      </SettingsSection>

      <SettingsSection {...section(SECTION_PAGE)}>
        <div className={PANEL_UI_CLASS.settingsGroup}>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={TWEAKS_SWITCH_ID}
              label={UI_TEXT.enablePageTweaksLabel}
              checked={tweaks}
              onChange={(checked) => {
                setTweaksEnabled(checked);
                setTweaks(checked);
                window.location.reload();
              }}
            />
          </div>
          <FeatureModules />
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={STATS_MENU_SWITCH_ID}
              label={STATS_MENU_SETTING_LABEL}
              checked={statsMenu}
              onChange={(checked) => {
                setFeatureEnabled(STATS_MENU_SETTING_ID, checked);
                setStatsMenu(checked);
                // The menu is on this very page: add or remove the item at once.
                installSiteMenu();
              }}
            />
          </div>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={STICKY_HEADER_SWITCH_ID}
              label={STICKY_HEADER_SETTING_LABEL}
              checked={stickyHeader}
              onChange={(checked) => {
                setFeatureEnabled(STICKY_HEADER_SETTING_ID, checked);
                setStickyHeader(checked);
                applyStickyHeader(checked);
              }}
            />
          </div>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <NumberField
              id={UPDATES_GROUP_SIZE_ID}
              label={UI_TEXT.updatesGroupSizeLabel}
              value={updatesGroup}
              min={0}
              step={1}
              onChange={(value) => {
                const next = value ?? 0;
                setUpdatesGroupSize(next);
                setUpdatesGroup(getUpdatesGroupSize());
              }}
            />
          </div>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <NumberField
              id={PLAYLIST_CHUNK_SIZE_ID}
              label={UI_TEXT.playlistChunkSizeLabel}
              value={playlistChunk}
              min={1}
              step={1}
              onChange={(value) => {
                const next = value ?? 0;
                setPlaylistChunkSize(next);
                setPlaylistChunk(getPlaylistChunkSize());
              }}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection {...section(SECTION_BLACKLIST)}>
        <BlacklistSection includeHeading={false} />
      </SettingsSection>

      <SettingsSection {...section(SECTION_FAVORITES)}>
        <div className={PANEL_UI_CLASS.settingsRow}>
          <Switch
            id={GRID_FAV_CHECKBOX_ID}
            label={UI_TEXT.gridFavButtonsLabel}
            checked={gridFavEnabled}
            onChange={(checked) => {
              setGridFavButtonsEnabled(checked);
              setGridFavButtonsVisible(checked);
              setGridFavEnabled(checked);
            }}
          />
        </div>
        <FavoritesSyncSection includeHeading={false} />
      </SettingsSection>

      <SettingsSection {...section(SECTION_DOWNLOADS)}>
        <DownloadsSection />
      </SettingsSection>

      <SettingsSection {...section(SECTION_DATA)}>
        <DataSection includeHeading={false} />
      </SettingsSection>
    </div>
  );
}

export function createSettingsPage(): HTMLElement {
  const root = document.createElement("div");
  preactRender(<SettingsPage />, root);
  return root;
}
