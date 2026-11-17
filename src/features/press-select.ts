const EVENT_MOUSEDOWN = "mousedown";
const EVENT_CLICK = "click";
const EVENT_DRAGSTART = "dragstart";
const MAIN_BUTTON = 0;
/** `detail` of a click that no press of the mouse made: Enter on a link, a script. */
const NO_PRESS = 0;

/**
 * What a press on `target` does while posts are being marked: the action to
 * run, or null when the press is not on a post and is left to the page.
 */
export type PressAction = (target: Element) => (() => void) | null;

/**
 * Marks a post at the press of the mouse button, not at its release.
 *
 * A click is a press and a release on the same element with no drag between
 * them. A thumbnail is a picture in a link, and both drag: a pointer that
 * moves a little while the button is down starts a drag, and the click never
 * comes. So posts clicked in passing were not marked. The press marks the
 * post at once and does not let a drag start; the click that follows is only
 * kept from opening the post. A click that no press made (the keyboard) marks.
 *
 * Returns the function that takes the listeners away.
 */
export function bindPressSelect(resolve: PressAction): () => void {
  const actionFor = (event: Event): (() => void) | null => {
    const target = event.target;
    return target instanceof Element ? resolve(target) : null;
  };
  const onMouseDown = (event: MouseEvent): void => {
    if (event.button !== MAIN_BUTTON) {
      return;
    }
    const action = actionFor(event);
    if (action === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    action();
  };
  const onClick = (event: MouseEvent): void => {
    const action = actionFor(event);
    if (action === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.detail === NO_PRESS) {
      action();
    }
  };
  const onDragStart = (event: DragEvent): void => {
    if (actionFor(event) !== null) {
      event.preventDefault();
    }
  };
  document.addEventListener(EVENT_MOUSEDOWN, onMouseDown, true);
  document.addEventListener(EVENT_CLICK, onClick, true);
  document.addEventListener(EVENT_DRAGSTART, onDragStart, true);
  return () => {
    document.removeEventListener(EVENT_MOUSEDOWN, onMouseDown, true);
    document.removeEventListener(EVENT_CLICK, onClick, true);
    document.removeEventListener(EVENT_DRAGSTART, onDragStart, true);
  };
}
