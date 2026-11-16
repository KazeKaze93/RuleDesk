import type { JSX } from "preact";

import { readStatsHistory, type StatsPoint } from "../storage/history";

/**
 * The History block of Statistics: one small line per number, drawn from the
 * daily points in `src/storage/history.ts`.
 */

export const HISTORY_CLASS = "rdw-stats-history";
const ROW_CLASS = "rdw-stats-history-row";
const LABEL_CLASS = "rdw-stats-history-label";
const LINE_CLASS = "rdw-stats-history-line";
const CHANGE_CLASS = "rdw-stats-history-change";
const HINT_CLASS = "rdw-stats-history-hint";
const HEADING_CLASS = "rdw-stats-label";

const HEADING = "History";
const EMPTY_HINT =
  "A point is kept for every day you open the site. The lines appear from the second day.";
const CHART_WIDTH = 240;
const CHART_HEIGHT = 36;
const CHART_PAD = 3;
const LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

export const STATS_HISTORY_CSS = `
.${HISTORY_CLASS} {
  display: grid;
  gap: 8px;
}
.${ROW_CLASS} {
  display: grid;
  grid-template-columns: 110px minmax(0, ${String(CHART_WIDTH)}px) minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.${LABEL_CLASS} {
  color: var(--rdw-text);
}
.${LINE_CLASS} {
  display: block;
  width: 100%;
  height: ${String(CHART_HEIGHT)}px;
  color: var(--rdw-accent);
}
.${CHANGE_CLASS},
.${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();

type Metric = {
  readonly label: string;
  readonly read: (point: StatsPoint) => number;
};

const METRICS: readonly Metric[] = [
  { label: "Favorites", read: (point) => point.favorites },
  { label: "Followed", read: (point) => point.followed },
  { label: "Collections", read: (point) => point.collections },
];

/** The points of a polyline that spreads `values` over the chart, the least at the bottom. */
export function sparklinePoints(values: readonly number[], width: number, height: number): string {
  if (values.length === 0) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const innerWidth = width - CHART_PAD * 2;
  const innerHeight = height - CHART_PAD * 2;
  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : CHART_PAD + (innerWidth * index) / (values.length - 1);
      // A flat series is drawn through the middle.
      const y =
        span === 0 ? height / 2 : CHART_PAD + innerHeight - (innerHeight * (value - min)) / span;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** "+120 since 3 Oct 2026", "−4 since …", "no change since …". */
export function changeText(first: StatsPoint, firstValue: number, lastValue: number): string {
  const since = new Date(first.day).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const delta = lastValue - firstValue;
  if (delta === 0) {
    return `no change since ${since}`;
  }
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${Math.abs(delta).toLocaleString(LOCALE)} since ${since}`;
}

export function StatsHistory(): JSX.Element {
  const history = readStatsHistory();
  const first = history[0];
  return (
    <div className={HISTORY_CLASS}>
      <style>{STATS_HISTORY_CSS}</style>
      <p className={HEADING_CLASS}>{HEADING}</p>
      {first === undefined || history.length < 2 ? (
        <p className={HINT_CLASS}>{EMPTY_HINT}</p>
      ) : (
        METRICS.map((metric) => {
          const values = history.map(metric.read);
          const last = values[values.length - 1] ?? 0;
          return (
            <div key={metric.label} className={ROW_CLASS}>
              <span className={LABEL_CLASS}>
                {`${metric.label} ${last.toLocaleString(LOCALE)}`}
              </span>
              <svg
                className={LINE_CLASS}
                viewBox={`0 0 ${String(CHART_WIDTH)} ${String(CHART_HEIGHT)}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${metric.label}: ${changeText(first, values[0] ?? 0, last)}`}
              >
                <polyline
                  points={sparklinePoints(values, CHART_WIDTH, CHART_HEIGHT)}
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <p className={CHANGE_CLASS}>{changeText(first, values[0] ?? 0, last)}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
