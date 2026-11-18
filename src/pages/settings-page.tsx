import {
  SETTINGS_SECTION_FAVORITES,
  settingsSectionFromHash,
  settingsSectionHash,
  takeSettingsSection,
} from "./settings-focus";
import type { ComponentChildren, JSX } from "preact";
import { Fragment, render as preactRender } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import { UI_TEXT } from "../config/constants";
import {
  FEATURES,
  SETTINGS_GROUP,
  SETTINGS_GROUPS,
  featureSettingsGroup,
  type SettingsGroupId,
} from "../features/registry";
import type { Feature } from "../features/types";
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
import {
  Button,
  Card,
  EmptyState,
  NumberField,
  OverlayInPlace,
  Select,
  Switch,
  TextField,
} from "../ui/kit";
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
  STICKY_TOP,
} from "../boot/sticky-header";
import { installSiteMenu } from "./menu";
import { aiHiddenEverywhere, setAiHiddenEverywhere } from "../features/ai-scope";

const AI_EVERYWHERE_SWITCH_ID = "rdw-ai-everywhere";
const AI_EVERYWHERE_LABEL = "Hide AI posts everywhere";
const AI_EVERYWHERE_CAPTION =
  "When off, Posts, Feed, Following, Collections and Favorites each keep their own Show / Hide choice.";

const TWEAKS_CAPTION =
  "Off: the site looks as without RuleDesk. The switches of the features need this on.";
/** The name without the hint that used to be in it; the hint is a line under it. */
const UPDATES_GROUP_SIZE_LABEL = "Artists per search";
const UPDATES_GROUP_SIZE_HINT = "0 means the default, 400.";

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
const SECTION_TITLE_CLASS = "rdw-settings-section-title";
const SECTION_ID_ATTR = "data-settings-section";
const SECTION_ID_PREFIX = "rdw-settings-section-";
/** On a section of rows: a search hides the rows that do not match, one by one. */
const SECTION_ROWS_ATTR = "data-settings-rows";
/** On a row or a section that a search has hidden. */
const HIDDEN_ATTR = "data-settings-hidden";
/** A card of rows: the lines are between the rows, the room is between the cards. */
const ROWS_CARD_CLASS = "rdw-settings-rows";
/** The card of the switch all the page tweaks depend on. */
const MASTER_CARD_CLASS = "rdw-settings-master";
const MASTER_ROW_CLASS = "rdw-settings-row--master";
const LAYOUT_CLASS = "rdw-settings-layout";
const NAV_CLASS = "rdw-settings-nav";
const NAV_TITLE_CLASS = "rdw-settings-nav-title";
const NAV_SUB_CLASS = "rdw-settings-nav-sub";
const NAV_LIST_CLASS = "rdw-settings-nav-list";
const NAV_LINK_CLASS = "rdw-settings-nav-link";
const NAV_RULE_CLASS = "rdw-settings-nav-rule";
const CONTENT_CLASS = "rdw-settings-content";

const NAV_WIDTH_PX = 200;
const CONTENT_WIDTH_PX = 720;
const LAYOUT_GAP_PX = 40;
/** Under this width the list of sections stands over the settings, not beside them. */
const LAYOUT_NARROW_PX = 900;
const SECTION_SCROLL_GAP_PX = 16;
/** A section whose top has come above this line of the window is the one being read. */
const ACTIVE_LINE_PX = 160;
/** How near the end of the page counts as its end, where the last section is the one. */
const PAGE_END_SLACK_PX = 2;

const PRODUCT_NAME = "RuleDesk";
const SETTINGS_WORD = "Settings";
const NAV_LABEL = "Sections of the settings";
const SEARCH_LABEL = "Search settings";
const CLEAR_LABEL = "Clear";
/** The name the matches of a search are painted under (CSS Custom Highlight). */
const MATCH_HIGHLIGHT = "rdw-settings-match";
const EVENT_SCROLL = "scroll";
const EVENT_HASHCHANGE = "hashchange";
const STYLE_TAG = "STYLE";

const SECTION_APPEARANCE = "appearance";
const SECTION_BLACKLIST = "blacklist";
const SECTION_FAVORITES = SETTINGS_SECTION_FAVORITES;
const SECTION_DOWNLOADS = "downloads";
const SECTION_DATA = "data";

type SectionDef = {
  readonly id: string;
  readonly title: string;
  /** After the rule in the list: not about a page of the site. */
  readonly service: boolean;
};

/**
 * The sections in the order of the page (the designer, 19.11.2026): what
 * changes the pages of the site first, then what serves the script itself.
 * There is no "Page" over the groups any more: a group is a section.
 */
const SECTIONS: readonly SectionDef[] = [
  { id: SECTION_APPEARANCE, title: "Appearance", service: false },
  ...SETTINGS_GROUPS.map((group) => ({ id: group.id, title: group.title, service: false })),
  { id: SECTION_FAVORITES, title: "Favorites", service: true },
  { id: SECTION_DOWNLOADS, title: "Downloads", service: true },
  { id: SECTION_BLACKLIST, title: "Blacklist", service: true },
  { id: SECTION_DATA, title: "Data", service: true },
];

/** "No settings match “…”." */
export function noSettingsMatch(query: string): string {
  return `No settings match \u201c${query.trim()}\u201d.`;
}

/** "Settings · 0.59.0", or the word alone where the script's manager does not say. */
export function settingsSubtitle(): string {
  const version = typeof GM_info === "undefined" ? "" : GM_info.script.version;
  return version.length > 0 ? `${SETTINGS_WORD} \u00b7 ${version}` : SETTINGS_WORD;
}

export const SETTINGS_SECTION_CSS = `
/* The list of sections on the left, held in place, and a column of settings
   beside it: a name and its switch are near each other, not a screen apart. */
.${LAYOUT_CLASS} {
  display: grid;
  grid-template-columns: ${String(NAV_WIDTH_PX)}px minmax(0, ${String(CONTENT_WIDTH_PX)}px);
  column-gap: ${String(LAYOUT_GAP_PX)}px;
  justify-content: center;
  align-items: start;
}
.${NAV_CLASS} {
  position: sticky;
  top: calc(${STICKY_TOP} + ${String(SECTION_SCROLL_GAP_PX)}px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.${NAV_TITLE_CLASS} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${NAV_SUB_CLASS} {
  margin: -10px 0 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${NAV_LIST_CLASS} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.${NAV_LINK_CLASS} {
  display: block;
  padding: 6px 10px;
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
  font-size: 13px;
  text-decoration: none;
}
.${NAV_LINK_CLASS}:hover {
  background: var(--rdw-surface);
}
.${NAV_LINK_CLASS}[aria-current="true"] {
  background: var(--rdw-surface-2);
  font-weight: 600;
}
.${NAV_RULE_CLASS} {
  height: 1px;
  margin: 8px 4px;
  background: var(--rdw-border);
}
.${CONTENT_CLASS} {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
/* Two levels only: a section with its name, and the card of its settings. */
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
  scroll-margin-top: calc(${STICKY_TOP} + ${String(SECTION_SCROLL_GAP_PX)}px);
}
.${SECTION_TITLE_CLASS} {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-card.${ROWS_CARD_CLASS} {
  padding: 2px 8px;
  gap: 0;
}
/* The switch the others depend on stands first and apart, on a ground of its own. */
.rdw-card.${MASTER_CARD_CLASS} {
  background: var(--rdw-surface-2);
}
.${MASTER_ROW_CLASS} .rdw-switch__label {
  font-weight: 600;
}
[${HIDDEN_ATTR}] {
  display: none !important;
}
::highlight(${MATCH_HIGHLIGHT}) {
  background-color: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
@media (max-width: ${String(LAYOUT_NARROW_PX)}px) {
  .${LAYOUT_CLASS} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 16px;
  }
  .${NAV_CLASS} {
    position: static;
  }
}
`.trim();

/** The words of an element as a reader sees them: the styles inside it are not words. */
function textNodes(root: Element): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (node instanceof Text && node.parentElement?.tagName !== STYLE_TAG) {
      nodes.push(node);
    }
  }
  return nodes;
}

function wordsOf(root: Element): string {
  return textNodes(root)
    .map((node) => node.data)
    .join(" ")
    .toLowerCase();
}

function setHidden(element: Element, hidden: boolean): void {
  if (hidden) {
    element.setAttribute(HIDDEN_ATTR, "");
  } else {
    element.removeAttribute(HIDDEN_ATTR);
  }
}

/**
 * Shows what matches the search and hides the rest; returns how many sections
 * are left. A section of rows loses the rows that do not match, and the list
 * of a setting goes with the setting. Any other section is kept whole when
 * something in it matches. The name of a section matches all of it.
 */
export function filterSettings(content: Element, query: string): number {
  const needle = query.trim().toLowerCase();
  let shown = 0;
  for (const section of content.querySelectorAll(`[${SECTION_ID_ATTR}]`)) {
    const rows = [...section.querySelectorAll(`.${PANEL_UI_CLASS.settingsRow}`)];
    const byRows = section.hasAttribute(SECTION_ROWS_ATTR);
    if (needle.length === 0) {
      setHidden(section, false);
      for (const row of rows) {
        setHidden(row, false);
      }
      shown += 1;
      continue;
    }
    const title = section.querySelector(`.${SECTION_TITLE_CLASS}`);
    const titleMatches = title !== null && wordsOf(title).includes(needle);
    if (!byRows || titleMatches) {
      for (const row of rows) {
        setHidden(row, false);
      }
      const matches = titleMatches || wordsOf(section).includes(needle);
      setHidden(section, !matches);
      shown += matches ? 1 : 0;
      continue;
    }
    let any = false;
    let ownerMatches = false;
    for (const row of rows) {
      const isSub = row.classList.contains(PANEL_UI_CLASS.settingsRowSub);
      const matches: boolean = wordsOf(row).includes(needle) || (isSub && ownerMatches);
      if (!isSub) {
        ownerMatches = matches;
      } else if (matches && row.previousElementSibling !== null) {
        // The list of a setting is not shown without the setting it belongs to.
        setHidden(row.previousElementSibling, false);
      }
      setHidden(row, !matches);
      any = any || matches;
    }
    setHidden(section, !any);
    shown += any ? 1 : 0;
  }
  return shown;
}

/** Paints the matches of the search where the browser can; elsewhere they are only filtered. */
function highlightMatches(content: Element, query: string): void {
  if (typeof Highlight === "undefined" || typeof CSS === "undefined" || !("highlights" in CSS)) {
    return;
  }
  CSS.highlights.delete(MATCH_HIGHLIGHT);
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return;
  }
  const ranges: Range[] = [];
  for (const node of textNodes(content)) {
    const text = node.data.toLowerCase();
    for (let from = text.indexOf(needle); from !== -1; from = text.indexOf(needle, from + needle.length)) {
      const range = new Range();
      range.setStart(node, from);
      range.setEnd(node, from + needle.length);
      ranges.push(range);
    }
  }
  if (ranges.length > 0) {
    CSS.highlights.set(MATCH_HIGHLIGHT, new Highlight(...ranges));
  }
}

/** One section: its name and what is under it. */
function SettingsSection(props: {
  readonly id: string;
  readonly title: string;
  /** True for a section that is rows only: a search filters them one by one. */
  readonly rows?: boolean;
  readonly children: ComponentChildren;
}): JSX.Element {
  return (
    <section
      id={`${SECTION_ID_PREFIX}${props.id}`}
      className={SECTION_CLASS}
      aria-labelledby={`${SECTION_ID_PREFIX}${props.id}-title`}
      {...{ [SECTION_ID_ATTR]: props.id }}
      {...(props.rows === true ? { [SECTION_ROWS_ATTR]: "" } : {})}
    >
      <h2 id={`${SECTION_ID_PREFIX}${props.id}-title`} className={SECTION_TITLE_CLASS}>
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

/** The switches of the features of one group, each with its list of options. */
function FeatureRows(props: {
  readonly features: readonly Feature[];
  /** True while the master switch is off: the rows show what is saved and take no clicks. */
  readonly disabled: boolean;
}): JSX.Element {
  const [, bump] = useState(0);
  const refresh = (): void => {
    bump((value) => value + 1);
  };

  return (
    <>
      {props.features.map((feature) => {
        const label = featurePanelLabel(feature.id, feature.label);
        const choice = feature.choice;
        return (
          <Fragment key={feature.id}>
            <div className={PANEL_UI_CLASS.settingsRow}>
              <Switch
                id={`${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`}
                label={label}
                checked={isFeatureEnabled(feature.id)}
                disabled={props.disabled}
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
                  disabled={props.disabled}
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
      })}
    </>
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

  const [aiEverywhere, setAiEverywhere] = useState(() => aiHiddenEverywhere());
  const [stickyHeader, setStickyHeader] = useState(() =>
    getFeatureEnabled(STICKY_HEADER_SETTING_ID, STICKY_HEADER_DEFAULT),
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [noMatch, setNoMatch] = useState(false);
  const [active, setActive] = useState<string>(SECTION_APPEARANCE);

  // The page is opened at a section by its address, "#rdw/settings/video", or
  // by a name left for it (see settings-focus.ts), and scrolls to it.
  const [asked] = useState(() => takeSettingsSection());
  useEffect(() => {
    const scrollTo = (id: string | null): void => {
      if (id === null) {
        return;
      }
      const target = rootRef.current?.querySelector(`[${SECTION_ID_ATTR}="${CSS.escape(id)}"]`);
      if (target instanceof HTMLElement && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "start" });
        setActive(id);
      }
    };
    scrollTo(settingsSectionFromHash(window.location.hash) ?? asked);
    const onHash = (): void => {
      scrollTo(settingsSectionFromHash(window.location.hash));
    };
    window.addEventListener(EVENT_HASHCHANGE, onHash);
    return () => {
      window.removeEventListener(EVENT_HASHCHANGE, onHash);
    };
  }, [asked]);

  // The section being read is marked in the list: the last one whose top has
  // come above a line near the top of the window, or the last of all at the end.
  useEffect(() => {
    const mark = (): void => {
      const sections = [
        ...(contentRef.current?.querySelectorAll(`[${SECTION_ID_ATTR}]:not([${HIDDEN_ATTR}])`) ?? []),
      ];
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= ACTIVE_LINE_PX) {
          current = section;
        }
      }
      const page = document.documentElement;
      if (window.innerHeight + window.scrollY >= page.scrollHeight - PAGE_END_SLACK_PX) {
        current = sections[sections.length - 1] ?? current;
      }
      const id = current?.getAttribute(SECTION_ID_ATTR) ?? null;
      if (id !== null) {
        setActive(id);
      }
    };
    window.addEventListener(EVENT_SCROLL, mark, { passive: true });
    return () => {
      window.removeEventListener(EVENT_SCROLL, mark);
    };
  }, []);

  // The search is laid over what is drawn: the sections draw themselves and
  // know nothing of it.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (content === null) {
      return;
    }
    setNoMatch(filterSettings(content, query) === 0);
    highlightMatches(content, query);
  });

  // Settings that are not features with a module. They work whether or not
  // the page tweaks are on, so the master switch does not disable them.
  const extraRows: Partial<Record<SettingsGroupId, JSX.Element>> = {
    [SETTINGS_GROUP.header]: (
      <>
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
      </>
    ),
    [SETTINGS_GROUP.feed]: (
      <div className={PANEL_UI_CLASS.settingsRow}>
        <NumberField
          id={UPDATES_GROUP_SIZE_ID}
          label={UPDATES_GROUP_SIZE_LABEL}
          value={updatesGroup}
          min={0}
          step={1}
          onChange={(value) => {
            const next = value ?? 0;
            setUpdatesGroupSize(next);
            setUpdatesGroup(getUpdatesGroupSize());
          }}
        />
        <p className={PANEL_UI_CLASS.settingsCaption}>{UPDATES_GROUP_SIZE_HINT}</p>
      </div>
    ),
    [SETTINGS_GROUP.ai]: (
      <div className={PANEL_UI_CLASS.settingsRow}>
        <Switch
          id={AI_EVERYWHERE_SWITCH_ID}
          label={AI_EVERYWHERE_LABEL}
          checked={aiEverywhere}
          onChange={(checked) => {
            // The site's switch is put right on the way to the next list.
            setAiHiddenEverywhere(checked);
            setAiEverywhere(checked);
          }}
        />
        <p className={PANEL_UI_CLASS.settingsCaption}>{AI_EVERYWHERE_CAPTION}</p>
      </div>
    ),
    [SETTINGS_GROUP.collections]: (
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
    ),
  };

  // The switches of the features of one section.
  const featuresOf = (group: SettingsGroupId): readonly Feature[] =>
    FEATURES.filter(
      (feature) =>
        !PAGE_FEATURE_SKIP.has(feature.id) && featureSettingsGroup(feature.id) === group,
    );
  const rowsCard = `${PANEL_UI_CLASS.pageCard} ${ROWS_CARD_CLASS}`;
  const groupIds = new Set<string>(SETTINGS_GROUPS.map((group) => group.id));
  const isEmptyGroup = (id: string): boolean =>
    SETTINGS_GROUPS.some(
      (group) =>
        group.id === id && featuresOf(group.id).length === 0 && extraRows[group.id] === undefined,
    );
  const sections = SECTIONS.filter((entry) => !isEmptyGroup(entry.id));

  const body = (id: string): JSX.Element | null => {
    if (id === SECTION_APPEARANCE) {
      return (
        <Card className={PANEL_UI_CLASS.pageCard}>
          <AppearanceSection includeHeading={false} />
          <style>{APPEARANCE_FLAT_ROWS_CSS}</style>
          <div className={PANEL_UI_CLASS.settingsGroup}>
            <FeatureRows features={featuresOf(SETTINGS_GROUP.appearance)} disabled={!tweaks} />
          </div>
        </Card>
      );
    }
    if (id === SECTION_FAVORITES) {
      return (
        <Card className={PANEL_UI_CLASS.pageCard}>
          <div className={PANEL_UI_CLASS.settingsGroup}>
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
            <FeatureRows features={featuresOf(SETTINGS_GROUP.favorites)} disabled={!tweaks} />
          </div>
          <FavoritesSyncSection includeHeading={false} />
        </Card>
      );
    }
    if (id === SECTION_DOWNLOADS) {
      return (
        <Card className={PANEL_UI_CLASS.pageCard}>
          <div className={PANEL_UI_CLASS.settingsGroup}>
            <FeatureRows features={featuresOf(SETTINGS_GROUP.downloads)} disabled={!tweaks} />
          </div>
          <DownloadsSection />
        </Card>
      );
    }
    if (id === SECTION_BLACKLIST) {
      return (
        <Card className={PANEL_UI_CLASS.pageCard}>
          <BlacklistSection includeHeading={false} />
        </Card>
      );
    }
    if (id === SECTION_DATA) {
      return (
        <Card className={PANEL_UI_CLASS.pageCard}>
          <DataSection includeHeading={false} />
        </Card>
      );
    }
    const group = SETTINGS_GROUPS.find((entry) => entry.id === id);
    if (group === undefined) {
      return null;
    }
    return (
      <Card className={rowsCard}>
        <FeatureRows features={featuresOf(group.id)} disabled={!tweaks} />
        {extraRows[group.id]}
      </Card>
    );
  };

  const navItem = (entry: SectionDef): JSX.Element => (
    <li key={entry.id}>
      <a
        className={`${NAV_LINK_CLASS} rdw-kit-focusable`}
        href={settingsSectionHash(entry.id)}
        {...(active === entry.id ? { "aria-current": "true" } : {})}
      >
        {entry.title}
      </a>
    </li>
  );

  return (
    <div className={LAYOUT_CLASS} ref={rootRef}>
      <style>{SETTINGS_SECTION_CSS}</style>
      <nav className={NAV_CLASS} aria-label={NAV_LABEL}>
        <p className={NAV_TITLE_CLASS}>{PRODUCT_NAME}</p>
        <p className={NAV_SUB_CLASS}>{settingsSubtitle()}</p>
        <TextField
          value={query}
          placeholder={SEARCH_LABEL}
          aria-label={SEARCH_LABEL}
          onChange={setQuery}
        />
        <ul className={NAV_LIST_CLASS}>
          {sections.filter((entry) => !entry.service).map(navItem)}
          <li className={NAV_RULE_CLASS} role="separator" />
          {sections.filter((entry) => entry.service).map(navItem)}
        </ul>
      </nav>
      <div className={`${CONTENT_CLASS} ${PANEL_UI_CLASS.scrollRegion}`} ref={contentRef}>
        {query.trim().length === 0 ? (
          <Card className={`${rowsCard} ${MASTER_CARD_CLASS}`}>
            <div className={`${PANEL_UI_CLASS.settingsRow} ${MASTER_ROW_CLASS}`}>
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
              <p className={PANEL_UI_CLASS.settingsCaption}>{TWEAKS_CAPTION}</p>
            </div>
          </Card>
        ) : null}
        {sections.map((entry) => (
          <SettingsSection
            key={entry.id}
            id={entry.id}
            title={entry.title}
            rows={groupIds.has(entry.id)}
          >
            {body(entry.id)}
          </SettingsSection>
        ))}
        {noMatch ? (
          <EmptyState
            title={noSettingsMatch(query)}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                }}
              >
                {CLEAR_LABEL}
              </Button>
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export function createSettingsPage(): HTMLElement {
  const root = document.createElement("div");
  // Stands on its own here, as in the shadow root of a page: what opens is drawn in it.
  preactRender(
    <OverlayInPlace.Provider value={true}>
      <SettingsPage />
    </OverlayInPlace.Provider>,
    root,
  );
  return root;
}
