/**
 * One way to write a date in the script's own interface (the designer,
 * 17.11.2026): "17 Nov 2026", and "17 Nov 2026, 11:12" where the time matters.
 * The same on every page, whatever the language of the browser.
 */

const DATE_LOCALE = "en-GB";

/** "17 Nov 2026" */
export function formatDay(time: number): string {
  return new Date(time).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "17 Nov 2026, 11:12" */
export function formatDayTime(time: number): string {
  const clock = new Date(time).toLocaleTimeString(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatDay(time)}, ${clock}`;
}

/** "Aug 2019" */
export function formatMonth(time: number): string {
  return new Date(time).toLocaleDateString(DATE_LOCALE, {
    month: "short",
    year: "numeric",
  });
}
