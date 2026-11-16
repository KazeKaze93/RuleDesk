import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { buildSearchUrl, parseTags } from "../search/query";
import { SectionLabel, Switch } from "../ui/kit";
import { isHideSeen, setHideSeen } from "./hide-seen";
import { clearRecentQueries, recentQueriesFor } from "./recent-queries";

/**
 * Two rows of the search panel: the "Hide seen posts" switch and the recent
 * searches. Their styles are part of the search panel's stylesheet.
 */

export const EXTRAS_SWITCH_ROW_CLASS = "rdw-search-tools-switch-row";
export const RECENT_CLASS = "rdw-search-tools-recent";
export const RECENT_HEAD_CLASS = "rdw-search-tools-recent-head";
export const RECENT_LIST_CLASS = "rdw-search-tools-recent-list";
export const RECENT_ITEM_CLASS = "rdw-search-tools-recent-item";
export const RECENT_CLEAR_CLASS = "rdw-search-tools-recent-clear";

const HIDE_SEEN_LABEL = "Hide seen posts";
const RECENT_LABEL = "Recent searches";
const CLEAR_LABEL = "Clear";
const CLEAR_TITLE = "Forget the recent searches";

export function HideSeenSwitch(): JSX.Element {
  const [on, setOn] = useState(() => isHideSeen());
  return (
    <div className={EXTRAS_SWITCH_ROW_CLASS}>
      <Switch
        label={HIDE_SEEN_LABEL}
        checked={on}
        onChange={(next) => {
          setHideSeen(next);
          setOn(next);
        }}
      />
    </div>
  );
}

export function RecentQueries(): JSX.Element | null {
  const [queries, setQueries] = useState(() => recentQueriesFor(window.location.search));
  if (queries.length === 0) {
    return null;
  }
  return (
    <div className={RECENT_CLASS}>
      <div className={RECENT_HEAD_CLASS}>
        <SectionLabel>{RECENT_LABEL}</SectionLabel>
        <button
          type="button"
          className={`${RECENT_CLEAR_CLASS} rdw-kit-focusable`}
          title={CLEAR_TITLE}
          onClick={() => {
            clearRecentQueries();
            setQueries([]);
          }}
        >
          {CLEAR_LABEL}
        </button>
      </div>
      <div className={RECENT_LIST_CLASS}>
        {queries.map((query) => (
          <a
            key={query}
            className={`${RECENT_ITEM_CLASS} rdw-kit-focusable`}
            href={buildSearchUrl(parseTags(query))}
            title={query}
          >
            {query}
          </a>
        ))}
      </div>
    </div>
  );
}
