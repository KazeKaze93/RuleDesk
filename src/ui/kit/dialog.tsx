import type { ComponentChildren, JSX, RefObject } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";

import { Button } from "./button";
import { KIT_FOCUS_CSS } from "./shared";
import { TextField } from "./text-field";

const DIALOG_VARIANT_CONTENT = "content";
const DIALOG_VARIANT_CONFIRM = "confirm";
const DIALOG_VARIANT_FIELDS = "fields";

const DEFAULT_NAME_LABEL = "Name";
const DEFAULT_QUERY_LABEL = "Query";
const DEFAULT_CONFIRM_TONE = "primary";

export type DialogConfirmTone = typeof DEFAULT_CONFIRM_TONE | "danger";

export type DialogFieldValues = {
  readonly name: string;
  readonly query: string;
};

type DialogShellProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly className?: string;
  readonly title?: string;
  readonly "aria-label"?: string;
  /** Optional element to focus when the dialog opens (falls back to first focusable / panel). */
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
};

export type DialogContentProps = DialogShellProps & {
  readonly variant?: typeof DIALOG_VARIANT_CONTENT;
  readonly children?: ComponentChildren;
};

export type DialogConfirmProps = DialogShellProps & {
  readonly variant: typeof DIALOG_VARIANT_CONFIRM;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly confirmTone?: DialogConfirmTone;
};

export type DialogFieldsProps = DialogShellProps & {
  readonly variant: typeof DIALOG_VARIANT_FIELDS;
  readonly fields: DialogFieldValues;
  readonly onFieldsChange: (fields: DialogFieldValues) => void;
  readonly onSubmit: () => void;
  readonly submitLabel: string;
  readonly cancelLabel: string;
  readonly nameLabel?: string;
  readonly queryLabel?: string;
};

export type DialogProps =
  | DialogContentProps
  | DialogConfirmProps
  | DialogFieldsProps;

const KEY_ESCAPE = "Escape";
const KEY_TAB = "Tab";
const EVENT_KEYDOWN = "keydown";
const EVENT_MOUSEDOWN = "mousedown";

const DIALOG_Z_INDEX = 40;
const DIALOG_MAX_WIDTH_PX = 360;
const DIALOG_BACKDROP_PADDING_PX = 16;
const DIALOG_BACKDROP_ALPHA = 0.45;
const DIALOG_PANEL_PADDING_PX = 16;
const DIALOG_PANEL_GAP_PX = 12;
const DIALOG_FIELDS_GAP_PX = 8;
const DIALOG_ACTIONS_GAP_PX = 8;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export const DIALOG_CSS = `
${KIT_FOCUS_CSS}
.rdw-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: ${String(DIALOG_Z_INDEX)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: ${String(DIALOG_BACKDROP_PADDING_PX)}px;
  background: rgba(0, 0, 0, ${String(DIALOG_BACKDROP_ALPHA)});
}
.rdw-dialog {
  box-sizing: border-box;
  width: 100%;
  max-width: ${String(DIALOG_MAX_WIDTH_PX)}px;
  display: grid;
  gap: ${String(DIALOG_PANEL_GAP_PX)}px;
  padding: ${String(DIALOG_PANEL_PADDING_PX)}px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-dialog__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-dialog__message {
  margin: 0;
}
.rdw-dialog__fields {
  display: grid;
  gap: ${String(DIALOG_FIELDS_GAP_PX)}px;
  margin: 0;
}
.rdw-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: ${String(DIALOG_ACTIONS_GAP_PX)}px;
}
`;

function listFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll(FOCUSABLE_SELECTOR);
  const result: HTMLElement[] = [];
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.closest("[hidden]") !== null) {
      continue;
    }
    result.push(node);
  }
  return result;
}

function pathIncludesNode(
  path: readonly EventTarget[],
  node: Node | null,
): boolean {
  if (node === null) {
    return false;
  }
  for (const entry of path) {
    if (entry === node) {
      return true;
    }
  }
  return false;
}

function renderDialogBody(props: DialogProps): JSX.Element | null {
  if (props.variant === DIALOG_VARIANT_CONFIRM) {
    const tone = props.confirmTone ?? DEFAULT_CONFIRM_TONE;
    return (
      <>
        <p className="rdw-dialog__message">{props.message}</p>
        <div className="rdw-dialog__actions">
          <Button variant="secondary" size="s" onClick={props.onClose}>
            {props.cancelLabel}
          </Button>
          <Button variant={tone} size="s" onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
        </div>
      </>
    );
  }

  if (props.variant === DIALOG_VARIANT_FIELDS) {
    const nameLabel = props.nameLabel ?? DEFAULT_NAME_LABEL;
    const queryLabel = props.queryLabel ?? DEFAULT_QUERY_LABEL;
    return (
      <form
        className="rdw-dialog__fields"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <TextField
          label={nameLabel}
          value={props.fields.name}
          onChange={(name) => {
            props.onFieldsChange({ name, query: props.fields.query });
          }}
        />
        <TextField
          label={queryLabel}
          value={props.fields.query}
          onChange={(query) => {
            props.onFieldsChange({ name: props.fields.name, query });
          }}
        />
        <div className="rdw-dialog__actions">
          <Button variant="secondary" size="s" type="button" onClick={props.onClose}>
            {props.cancelLabel}
          </Button>
          <Button variant="primary" size="s" type="submit">
            {props.submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  return <>{props.children}</>;
}

export function Dialog(props: DialogProps): JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const hasTitle = props.title !== undefined && props.title.length > 0;

  useEffect(() => {
    if (!props.open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        const restore = restoreFocusRef.current;
        restoreFocusRef.current = null;
        if (restore !== null && typeof restore.focus === "function") {
          restore.focus();
        }
      }
      return;
    }

    if (!wasOpenRef.current) {
      const active = document.activeElement;
      restoreFocusRef.current =
        active instanceof HTMLElement ? active : null;
      wasOpenRef.current = true;
    }

    const panel = panelRef.current;
    if (panel !== null) {
      const initial = props.initialFocusRef?.current ?? null;
      if (initial !== null && typeof initial.focus === "function") {
        initial.focus();
      } else {
        const focusable = listFocusable(panel);
        const first = focusable[0];
        if (first !== undefined) {
          first.focus();
        } else {
          panel.focus();
        }
      }
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === KEY_ESCAPE) {
        event.preventDefault();
        event.stopPropagation();
        props.onClose();
        return;
      }
      if (event.key !== KEY_TAB) {
        return;
      }
      const currentPanel = panelRef.current;
      if (currentPanel === null) {
        return;
      }
      const focusable = listFocusable(currentPanel);
      if (focusable.length === 0) {
        event.preventDefault();
        currentPanel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !currentPanel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: MouseEvent): void => {
      const currentPanel = panelRef.current;
      if (currentPanel === null) {
        return;
      }
      const path = event.composedPath();
      if (pathIncludesNode(path, currentPanel)) {
        return;
      }
      props.onClose();
    };

    document.addEventListener(EVENT_KEYDOWN, onKeyDown, true);
    document.addEventListener(EVENT_MOUSEDOWN, onPointerDown, true);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown, true);
      document.removeEventListener(EVENT_MOUSEDOWN, onPointerDown, true);
    };
  }, [props.open, props.onClose, props.initialFocusRef]);

  if (!props.open) {
    return null;
  }

  const className = ["rdw-dialog", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{DIALOG_CSS}</style>
      <div className="rdw-dialog-backdrop">
        <div
          ref={panelRef}
          className={className}
          role="dialog"
          aria-modal="true"
          aria-label={hasTitle ? undefined : props["aria-label"]}
          aria-labelledby={hasTitle ? titleId : undefined}
          tabIndex={-1}
        >
          {hasTitle ? (
            <h2 id={titleId} className="rdw-dialog__title">
              {props.title}
            </h2>
          ) : null}
          {renderDialogBody(props)}
        </div>
      </div>
    </>
  );
}
