import type { JSX } from "preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dialog } from "../../../src/ui/kit/dialog";
import { flushEffects } from "../../kit/render";

const HOST_ID = "rdw-dialog-test-host";
const DIALOG_ARIA = "Bulk confirm dialog";
const DIALOG_MAX_WIDTH_PX = 360;

function DialogHarness(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        id="dialog-trigger"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-label={DIALOG_ARIA}
      >
        <button type="button" id="dialog-first">
          First
        </button>
        <button type="button" id="dialog-last">
          Last
        </button>
      </Dialog>
    </div>
  );
}

describe("Dialog", () => {
  afterEach(() => {
    const host = document.getElementById(HOST_ID);
    if (host !== null) {
      act(() => {
        render(null, host);
      });
      host.remove();
    }
  });

  it("renders a centered modal with role=dialog, aria-modal, and max-width 360px", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });
    clickOpen();
    await flushEffects();

    const panel = document.querySelector(
      `[role="dialog"][aria-label="${DIALOG_ARIA}"]`,
    );
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("aria-modal")).toBe("true");
    expect(document.querySelector(".rdw-dialog-backdrop")).not.toBeNull();

    const style = [...host.querySelectorAll("style")].find((node) =>
      (node.textContent ?? "").includes(".rdw-dialog"),
    );
    expect(style?.textContent).toContain(
      `max-width: ${String(DIALOG_MAX_WIDTH_PX)}px`,
    );
    expect(style?.textContent).toContain("position: fixed");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });

    const trigger = document.getElementById("dialog-trigger");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }
    trigger.focus();
    act(() => {
      trigger.click();
    });
    await flushEffects();

    expect(
      document.querySelector(`[role="dialog"][aria-label="${DIALOG_ARIA}"]`),
    ).not.toBeNull();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(
      document.querySelector(`[role="dialog"][aria-label="${DIALOG_ARIA}"]`),
    ).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab focus inside the dialog panel", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });
    clickOpen();
    await flushEffects();

    const first = document.getElementById("dialog-first");
    const last = document.getElementById("dialog-last");
    expect(first).toBeInstanceOf(HTMLButtonElement);
    expect(last).toBeInstanceOf(HTMLButtonElement);
    if (
      !(first instanceof HTMLButtonElement) ||
      !(last instanceof HTMLButtonElement)
    ) {
      return;
    }

    last.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(document.activeElement).toBe(first);

    first.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
          shiftKey: true,
        }),
      );
    });
    expect(document.activeElement).toBe(last);
  });
});

describe("Dialog variants", () => {
  afterEach(() => {
    const host = document.getElementById(HOST_ID);
    if (host !== null) {
      act(() => {
        render(null, host);
      });
      host.remove();
    }
  });

  it("fields variant edits name and query, then submits", async () => {
    const onSubmit = vi.fn();
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(
        <FieldsHarness onSubmit={onSubmit} />,
        host,
      );
    });
    await flushEffects();

    const panel = document.querySelector('[role="dialog"]');
    expect(panel).not.toBeNull();
    const nameInput = labeledInput("Name");
    const queryInput = labeledInput("Query");
    setInputValue(nameInput, "Night");
    setInputValue(queryInput, "score:>10");
    expect(nameInput.value).toBe("Night");
    expect(queryInput.value).toBe("score:>10");

    const form = panel?.querySelector("form");
    expect(form).toBeInstanceOf(HTMLFormElement);
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("fields form missing");
    }
    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("fields cancel closes without submitting", async () => {
    const onSubmit = vi.fn();
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<FieldsHarness onSubmit={onSubmit} />, host);
    });
    await flushEffects();

    clickButton("Cancel");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("confirm variant calls onConfirm and cancel closes", async () => {
    const onConfirm = vi.fn();
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<ConfirmHarness onConfirm={onConfirm} />, host);
    });
    await flushEffects();

    const panel = document.querySelector('[role="dialog"]');
    expect(panel?.textContent).toContain("Remove 2 posts?");
    const confirm = buttonByText("Remove");
    expect(confirm.className).toContain("rdw-btn--danger");
    act(() => {
      confirm.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    clickButton("Keep");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

function FieldsHarness(props: { readonly onSubmit: () => void }): JSX.Element {
  const [open, setOpen] = useState(true);
  const [fields, setFields] = useState({ name: "", query: "" });
  return (
    <Dialog
      open={open}
      title="Save search"
      variant="fields"
      fields={fields}
      onFieldsChange={setFields}
      onSubmit={props.onSubmit}
      submitLabel="Save"
      cancelLabel="Cancel"
      onClose={() => {
        setOpen(false);
      }}
    />
  );
}

function ConfirmHarness(props: { readonly onConfirm: () => void }): JSX.Element {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      open={open}
      variant="confirm"
      title="Remove posts"
      message="Remove 2 posts?"
      confirmLabel="Remove"
      cancelLabel="Keep"
      confirmTone="danger"
      onConfirm={props.onConfirm}
      onClose={() => {
        setOpen(false);
      }}
    />
  );
}

function labeledInput(labelText: string): HTMLInputElement {
  const labels = [...document.querySelectorAll("label")];
  const label = labels.find((node) => node.textContent === labelText);
  if (label === undefined) {
    throw new Error(`label missing: ${labelText}`);
  }
  const inputId = label.getAttribute("for");
  if (inputId === null) {
    throw new Error(`label has no for: ${labelText}`);
  }
  const input = document.getElementById(inputId);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`input missing: ${labelText}`);
  }
  return input;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function buttonByText(text: string): HTMLButtonElement {
  const buttons = [...document.querySelectorAll("button")];
  const match = buttons.find((node) => node.textContent === text);
  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`button missing: ${text}`);
  }
  return match;
}

function clickButton(text: string): void {
  const button = buttonByText(text);
  act(() => {
    button.click();
  });
}

function clickOpen(): void {
  const trigger = document.getElementById("dialog-trigger");
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error("dialog trigger missing");
  }
  act(() => {
    trigger.click();
  });
}
