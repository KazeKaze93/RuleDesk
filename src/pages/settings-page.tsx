import type { JSX } from "preact";
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
  setFeatureEnabled,
  setGridFavButtonsEnabled,
  setPlaylistChunkSize,
  setTweaksEnabled,
  setUpdatesGroupSize,
} from "../storage/store";
import { AppearanceSection } from "../ui/appearance-section";
import { setGridFavButtonsVisible } from "../ui/cards";
import {
  Card,
  NumberField,
  SectionLabel,
  Select,
  Switch,
} from "../ui/kit";
import { BlacklistSection } from "./blacklist-section";
import {
  FEATURE_CHECKBOX_ID_PREFIX,
  FEATURE_CHOICE_ID_PREFIX,
  featurePanelLabel,
  GRID_FAV_CHECKBOX_ID,
  PANEL_UI_CLASS,
  PLAYLIST_CHUNK_SIZE_ID,
  TWEAKS_SWITCH_ID,
  UPDATES_GROUP_SIZE_ID,
} from "./constants";
import { DataSection } from "./data-section";
import { FavoritesSyncSection } from "./favorites-sync-section";

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
                  className={PANEL_UI_CLASS.settingsRow}
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

  return (
    <div className={PANEL_UI_CLASS.scrollRegion}>
      <Card className={PANEL_UI_CLASS.pageCard}>
        <AppearanceSection />
        <style>{APPEARANCE_FLAT_ROWS_CSS}</style>
      </Card>

      <Card className={PANEL_UI_CLASS.pageCard}>
        <SectionLabel>Page</SectionLabel>
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
      </Card>

      <Card className={PANEL_UI_CLASS.pageCard}>
        <BlacklistSection />
      </Card>

      <Card className={PANEL_UI_CLASS.pageCard}>
        <SectionLabel>Favorites</SectionLabel>
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
      </Card>

      <Card className={PANEL_UI_CLASS.pageCard}>
        <DataSection />
      </Card>
    </div>
  );
}

export function createSettingsPage(): HTMLElement {
  const root = document.createElement("div");
  preactRender(<SettingsPage />, root);
  return root;
}
