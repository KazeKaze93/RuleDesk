import { useEffect, useRef } from "preact/hooks";

const EVENT_KEYDOWN = "keydown";
/** Where a letter is typed or belongs to what is open, not to the page. */
const TYPING_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable]",
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
].join(", ");
const OPEN_DIALOG_SELECTOR = '[role="dialog"]';
const VIDEO_SELECTOR = "video";

/**
 * True when the key is not the page's: pressed with a modifier, held down,
 * taken by something else, typed into a field, pressed while a dialog is open,
 * or pressed in a video or in the player around one, which has its own keys.
 */
function notForThePage(event: KeyboardEvent): boolean {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return true;
  }
  if (document.querySelector(OPEN_DIALOG_SELECTOR) !== null) {
    return true;
  }
  const origin = event.composedPath()[0];
  if (!(origin instanceof Element)) {
    return false;
  }
  if (origin.closest(TYPING_SELECTOR) !== null) {
    return true;
  }
  if (origin === document.body || origin === document.documentElement) {
    return false;
  }
  return origin.closest(VIDEO_SELECTOR) !== null || origin.querySelector(VIDEO_SELECTOR) !== null;
}

/**
 * Runs `run` when the key with this `code` is pressed on the page. The code
 * is the place of the key, not its letter: "KeyF" is the same key in the
 * Russian layout, where it types another letter.
 */
export function useHotkey(code: string, active: boolean, run: () => void): void {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== code || notForThePage(event)) {
        return;
      }
      event.preventDefault();
      latest.current();
    };
    document.addEventListener(EVENT_KEYDOWN, onKeyDown);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown);
    };
  }, [active, code]);
}
