import { useEffect, useRef } from "preact/hooks";

const EVENT_KEYDOWN = "keydown";
const KEY_ESCAPE = "Escape";
const ARIA_TRUE = "true";
/** Where Escape belongs to what is under the caret or open, not to the page. */
const OWN_ESCAPE_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
].join(", ");

/** True when Escape was pressed in something that takes it itself: a field, an open list, a dialog. */
function takenElsewhere(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) {
    return true;
  }
  const origin = event.composedPath()[0];
  if (!(origin instanceof Element)) {
    return false;
  }
  return (
    origin.closest(OWN_ESCAPE_SELECTOR) !== null ||
    origin.getAttribute("aria-expanded") === ARIA_TRUE
  );
}

/**
 * Runs `onEscape` when Escape is pressed while `active`: the way out of a
 * mode of the page, such as selecting posts. A dialog takes the key before it
 * gets here; a field, an open list or a menu keep it too.
 */
export function useEscape(active: boolean, onEscape: () => void): void {
  const latest = useRef(onEscape);
  latest.current = onEscape;
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== KEY_ESCAPE || takenElsewhere(event)) {
        return;
      }
      latest.current();
    };
    document.addEventListener(EVENT_KEYDOWN, onKeyDown);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown);
    };
  }, [active]);
}
