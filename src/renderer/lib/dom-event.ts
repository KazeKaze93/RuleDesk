/** Portal-rendered descendants still bubble React synthetics to the host; ignore events whose target is not DOM-contained in currentTarget. */
export function isEventFromOwnDom(event: {
  target: EventTarget | null;
  currentTarget: EventTarget;
}): boolean {
  return (
    event.target instanceof Node &&
    event.currentTarget instanceof Element &&
    event.currentTarget.contains(event.target)
  );
}
