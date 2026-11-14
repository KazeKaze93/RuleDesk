import type { JSX } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";

import { Button } from "./button";
import { KIT_FOCUS_CSS } from "./shared";

/** How long a toast stays visible before it dismisses itself. */
export const TOAST_AUTO_HIDE_MS = 6000;

const TOAST_Z_INDEX = 45;
const TOAST_BOTTOM_PX = 16;
const TOAST_SIDE_GUTTER_PX = 16;
const TOAST_MAX_WIDTH_PX = 420;
const TOAST_PADDING_X_PX = 12;
const TOAST_PADDING_Y_PX = 8;
const TOAST_GAP_PX = 12;

export type ToastAction = {
  readonly label: string;
  readonly onClick: () => void;
};

export type ToastProps = {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
  readonly action?: ToastAction;
};

type ToastSlot = {
  readonly id: number;
  readonly close: () => void;
  timerId: number | null;
};

let nextToastSlotId = 0;
let activeToastSlot: ToastSlot | null = null;

function clearSlotTimer(slot: ToastSlot): void {
  if (slot.timerId === null) {
    return;
  }
  window.clearTimeout(slot.timerId);
  slot.timerId = null;
}

function takeToastSlot(close: () => void): ToastSlot {
  nextToastSlotId += 1;
  const slot: ToastSlot = {
    id: nextToastSlotId,
    close,
    timerId: null,
  };
  const previous = activeToastSlot;
  activeToastSlot = slot;
  if (previous !== null) {
    clearSlotTimer(previous);
    previous.close();
  }
  return slot;
}

function dismissToast(id: number): void {
  if (activeToastSlot === null || activeToastSlot.id !== id) {
    return;
  }
  const slot = activeToastSlot;
  clearSlotTimer(slot);
  activeToastSlot = null;
  slot.close();
}

function releaseToastSlot(id: number): void {
  if (activeToastSlot !== null && activeToastSlot.id === id) {
    activeToastSlot = null;
  }
}

export const TOAST_CSS = `
${KIT_FOCUS_CSS}
.rdw-toast {
  position: fixed;
  z-index: ${String(TOAST_Z_INDEX)};
  left: 50%;
  bottom: ${String(TOAST_BOTTOM_PX)}px;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${String(TOAST_GAP_PX)}px;
  width: max-content;
  max-width: min(${String(TOAST_MAX_WIDTH_PX)}px, calc(100% - ${String(TOAST_SIDE_GUTTER_PX * 2)}px));
  padding: ${String(TOAST_PADDING_Y_PX)}px ${String(TOAST_PADDING_X_PX)}px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-toast__message {
  margin: 0;
}
`;

export function Toast(props: ToastProps): JSX.Element | null {
  const [slotId, setSlotId] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!props.open) {
      setSlotId(null);
      return;
    }

    let alive = true;
    const slot = takeToastSlot(() => {
      if (alive) {
        setSlotId(null);
      }
      props.onClose();
    });
    setSlotId(slot.id);
    slot.timerId = window.setTimeout(() => {
      dismissToast(slot.id);
    }, TOAST_AUTO_HIDE_MS);

    return () => {
      alive = false;
      clearSlotTimer(slot);
      releaseToastSlot(slot.id);
    };
  }, [props.open, props.message, props.onClose]);

  if (!props.open || slotId === null) {
    return null;
  }
  if (activeToastSlot === null || activeToastSlot.id !== slotId) {
    return null;
  }

  return (
    <>
      <style>{TOAST_CSS}</style>
      <div className="rdw-toast" role="status">
        <p className="rdw-toast__message">{props.message}</p>
        {props.action !== undefined ? (
          <Button variant="secondary" size="s" onClick={props.action.onClick}>
            {props.action.label}
          </Button>
        ) : null}
      </div>
    </>
  );
}
