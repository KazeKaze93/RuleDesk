import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../../../src/ui/kit/button";
import { SelectionBar } from "../../../src/ui/kit/selection-bar";
import { cleanupKit, fireClick, flushEffects, renderKit } from "../../kit/render";

const hosts: HTMLElement[] = [];

afterEach(() => {
  while (hosts.length > 0) {
    const host = hosts.pop();
    if (host !== undefined) {
      cleanupKit(host);
    }
  }
});

function mount(node: Parameters<typeof renderKit>[0]): HTMLElement {
  const host = renderKit(node);
  hosts.push(host);
  return host;
}

function labels(host: HTMLElement): string[] {
  return [...host.querySelectorAll("button")].map((node) => node.textContent.trim());
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const found = [...host.querySelectorAll("button")].find(
    (node) => node.textContent.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`no button ${label}`);
  }
  return found;
}

function pressCtrlA(target: Element): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    code: "KeyA",
    key: "a",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe("SelectionBar", () => {
  it("keeps one order in a row: count, select all, clear, actions, danger, cancel", () => {
    const host = mount(
      <SelectionBar
        count={3}
        onSelectAll={() => undefined}
        onClear={() => undefined}
        onCancel={() => undefined}
        danger={<Button variant="danger-quiet">Unfollow…</Button>}
      >
        <Button>Move to group</Button>
      </SelectionBar>,
    );
    const bar = host.querySelector('[role="toolbar"][aria-label="Selection"]');
    expect(bar).not.toBeNull();
    expect(bar?.firstElementChild?.nextElementSibling?.textContent).toBe("3 selected");
    expect(labels(host)).toEqual(["Select all", "Clear", "Move to group", "Unfollow…", "Cancel"]);
    expect(host.querySelectorAll(".rdw-selbar__rule")).toHaveLength(1);
  });

  it("puts Cancel beside the count in a stack, and has no rule without a dangerous action", () => {
    const host = mount(
      <SelectionBar
        layout="stack"
        count={4}
        selectAllLabel="Select page"
        onSelectAll={() => undefined}
        onClear={() => undefined}
        onCancel={() => undefined}
      >
        <Button>Add to collection</Button>
        <Button>Download selected</Button>
      </SelectionBar>,
    );
    expect(host.querySelector(".rdw-selbar--stack")).not.toBeNull();
    // The hint names the key that does the same.
    expect(button(host, "Select page").title).toBe("Select page (Ctrl+A)");
    expect(labels(host)).toEqual([
      "Cancel",
      "Select page",
      "Clear",
      "Add to collection",
      "Download selected",
    ]);
    expect(host.querySelector(".rdw-selbar__rule")).toBeNull();
  });

  it("with nothing selected keeps Select all and Cancel and locks Clear", () => {
    const host = mount(
      <SelectionBar
        count={0}
        onSelectAll={() => undefined}
        onClear={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(host.textContent).toContain("0 selected");
    expect(button(host, "Clear").disabled).toBe(true);
    expect(button(host, "Select all").disabled).toBe(false);
    expect(button(host, "Cancel").disabled).toBe(false);
  });

  it("calls back from its buttons", () => {
    const onSelectAll = vi.fn();
    const onClear = vi.fn();
    const onCancel = vi.fn();
    const host = mount(
      <SelectionBar count={2} onSelectAll={onSelectAll} onClear={onClear} onCancel={onCancel} />,
    );
    fireClick(button(host, "Select all"));
    fireClick(button(host, "Clear"));
    fireClick(button(host, "Cancel"));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("selects all on Ctrl+A, but leaves the key to a field", async () => {
    const onSelectAll = vi.fn();
    const host = mount(
      <SelectionBar
        count={0}
        onSelectAll={onSelectAll}
        onClear={() => undefined}
        onCancel={() => undefined}
      />,
    );
    await flushEffects();

    const field = document.createElement("input");
    host.append(field);
    expect(pressCtrlA(field).defaultPrevented).toBe(false);
    expect(onSelectAll).not.toHaveBeenCalled();

    expect(pressCtrlA(document.body).defaultPrevented).toBe(true);
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });
});
