import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GROUP_ALL,
  GROUP_NAME_MAX,
  GROUP_NONE,
  GROUPS_CSS,
  GroupDialogs,
  GroupTabs,
  MoveToGroupMenu,
  countGroups,
  deleteGroupMessage,
  fitGroupTabs,
  inGroupTab,
  shortGroupName,
} from "../../src/ui/groups";
import { cleanupKit, fireClick, flushEffects, renderKit } from "../kit/render";

const hosts: HTMLElement[] = [];

afterEach(() => {
  while (hosts.length > 0) {
    const host = hosts.pop();
    if (host !== undefined) {
      cleanupKit(host);
    }
  }
  for (const left of document.querySelectorAll(".rdw-popover")) {
    left.remove();
  }
});

function mount(node: Parameters<typeof renderKit>[0]): HTMLElement {
  const host = renderKit(node);
  hosts.push(host);
  return host;
}

function byText(root: ParentNode, selector: string, text: string): HTMLElement {
  const found = [...root.querySelectorAll(selector)].find(
    (node) => node.textContent.trim() === text,
  );
  if (!(found instanceof HTMLElement)) {
    throw new Error(`no ${selector} "${text}"`);
  }
  return found;
}

function setValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("groups", () => {
  it("counts the groups and tells what is under a tab", () => {
    expect(countGroups(["A", "B"], ["A", undefined, "A", "", "C"])).toEqual([
      { name: "A", count: 2 },
      { name: "B", count: 0 },
    ]);
    expect(inGroupTab("A", GROUP_ALL)).toBe(true);
    expect(inGroupTab(undefined, GROUP_NONE)).toBe(true);
    expect(inGroupTab("A", GROUP_NONE)).toBe(false);
    expect(inGroupTab("A", "A")).toBe(true);
    expect(inGroupTab("A", "B")).toBe(false);
  });

  it("shows All, each group, No group for the rest, and New group", () => {
    const onChange = vi.fn();
    const onNew = vi.fn();
    const host = mount(
      <GroupTabs
        total={22}
        groups={[
          { name: "Artists", count: 11 },
          { name: "Characters", count: 3 },
        ]}
        value="Artists"
        onChange={onChange}
        onNew={onNew}
        onRename={() => undefined}
        onDelete={() => undefined}
      />,
    );
    const tabs = [...host.querySelectorAll('[role="tab"]')].map((node) => node.textContent);
    expect(tabs).toEqual(["All22", "Artists11", "Characters3", "No group8"]);
    expect(byText(host, '[role="tab"]', "Artists11").getAttribute("aria-selected")).toBe("true");
    fireClick(byText(host, '[role="tab"]', "No group8"));
    expect(onChange).toHaveBeenCalledWith(GROUP_NONE);
    fireClick(byText(host, "button", "New group"));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("goes from tab to tab with the arrows and opens the one it comes to", () => {
    const onChange = vi.fn();
    const host = mount(
      <GroupTabs
        total={3}
        groups={[{ name: "Artists", count: 2 }]}
        value={GROUP_ALL}
        onChange={onChange}
        onNew={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
      />,
    );
    const press = (from: string, key: string): void => {
      byText(host, '[role="tab"]', from).dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
    };
    press("All3", "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith("Artists");
    press("Artists2", "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith(GROUP_NONE);
    press("No group1", "ArrowRight");
    expect(onChange).toHaveBeenCalledTimes(2);
    press("Artists2", "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith(GROUP_ALL);
  });

  it("gives a tab to as many groups as fit, and to the open one always", () => {
    const gap = 10;
    // All of them fit: 3 x (50 + 10).
    expect(fitGroupTabs([50, 50, 50], -1, 180, 40, gap)).toEqual([0, 1, 2]);
    // Not all: room is left for "More", and the first that fit have tabs.
    expect(fitGroupTabs([50, 50, 50], -1, 170, 40, gap)).toEqual([0, 1]);
    // The open group takes the last place, and what was there goes to the menu.
    expect(fitGroupTabs([50, 50, 50, 50], 3, 170, 40, gap)).toEqual([0, 3]);
    // No room for any: only the open one, when there is one.
    expect(fitGroupTabs([50, 50], -1, 60, 40, gap)).toEqual([]);
    expect(fitGroupTabs([50, 50], 1, 60, 40, gap)).toEqual([1]);
  });

  it("cuts a long name on its tab and keeps it whole in the hint", () => {
    const long = "A group with a very long name indeed";
    expect(shortGroupName("Artists")).toBe("Artists");
    expect(shortGroupName(long)).toBe("A group with a very \u2026");
    const host = mount(
      <GroupTabs
        total={1}
        groups={[{ name: long, count: 1 }]}
        value={GROUP_ALL}
        onChange={() => undefined}
        onNew={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
      />,
    );
    const tab = host.querySelectorAll('[role="tab"]')[1];
    expect(tab?.textContent).toBe("A group with a very \u20261");
    expect(tab?.getAttribute("title")).toBe(long);
  });

  it("has a field to find a group in when there are more than ten", async () => {
    const names = Array.from({ length: 11 }, (_unused, index) => `Group ${String(index + 1)}`);
    const onMove = vi.fn();
    const host = mount(
      <MoveToGroupMenu groups={names} onMove={onMove} onNew={() => undefined} />,
    );
    fireClick(byText(host, "button", "Move to group"));
    await flushEffects();
    const field = document.querySelector('input[aria-label="Find a group"]');
    expect(field).toBeInstanceOf(HTMLInputElement);
    if (!(field instanceof HTMLInputElement)) {
      return;
    }
    setValue(field, "group 11");
    await flushEffects();
    // What is found, and "No group" and "New group…" under it whatever is typed.
    expect([...document.querySelectorAll('[role="menuitem"]')].map((node) => node.textContent)).toEqual([
      "Group 11",
      "No group",
      "New group…",
    ]);
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(onMove).toHaveBeenCalledWith("Group 11");
  });

  it("has no such field with ten groups or fewer", async () => {
    const host = mount(
      <MoveToGroupMenu groups={["Artists"]} onMove={() => undefined} onNew={() => undefined} />,
    );
    fireClick(byText(host, "button", "Move to group"));
    await flushEffects();
    expect(document.querySelector('input[aria-label="Find a group"]')).toBeNull();
  });

  it("has only All and New group while there is no group", () => {
    const host = mount(
      <GroupTabs
        total={5}
        groups={[]}
        value={GROUP_ALL}
        onChange={() => undefined}
        onNew={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect([...host.querySelectorAll('[role="tab"]')].map((node) => node.textContent)).toEqual([
      "All5",
    ]);
  });

  it("renames and deletes a group from the menu of its tab", async () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    const host = mount(
      <GroupTabs
        total={3}
        groups={[
          { name: "Artists", count: 2 },
          { name: "Painters", count: 0 },
        ]}
        value="Artists"
        onChange={() => undefined}
        onNew={() => undefined}
        onRename={onRename}
        onDelete={onDelete}
      />,
    );
    // Only the open group has the button, and there it is always seen.
    expect(host.querySelectorAll('button[aria-label="Group options"]')).toHaveLength(1);
    const more = host.querySelector('[data-group="Artists"] button[aria-label="Group options"]');
    expect(more).toBeInstanceOf(HTMLButtonElement);
    expect(GROUPS_CSS).not.toContain("opacity: 0;");
    if (more instanceof HTMLButtonElement) {
      fireClick(more);
    }
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "Rename\u2026"));
    expect(onRename).toHaveBeenCalledWith("Artists");
    if (more instanceof HTMLButtonElement) {
      fireClick(more);
    }
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "Delete group\u2026"));
    expect(onDelete).toHaveBeenCalledWith("Artists");
  });

  it("takes a dropped card on a group and on No group, not on All", async () => {
    const onDropTo = vi.fn();
    const host = mount(
      <GroupTabs
        total={3}
        groups={[{ name: "Artists", count: 2 }]}
        value={GROUP_ALL}
        onChange={() => undefined}
        onNew={() => undefined}
        onRename={() => undefined}
        onDelete={() => undefined}
        dragging
        onDropTo={onDropTo}
      />,
    );
    const drop = (tab: string): void => {
      byText(host, '[role="tab"]', tab).parentElement?.dispatchEvent(
        new Event("drop", { bubbles: true, cancelable: true }),
      );
    };
    drop("All3");
    expect(onDropTo).not.toHaveBeenCalled();
    drop("Artists2");
    expect(onDropTo).toHaveBeenLastCalledWith("Artists");
    drop("No group1");
    expect(onDropTo).toHaveBeenLastCalledWith(null);
    // The tabs say they take a card, and the one that took it nods once.
    expect(host.querySelector('[role="tablist"]')?.className).toContain("rdw-groups--dragging");
    await flushEffects();
    const took = byText(host, '[role="tab"]', "No group1").parentElement;
    expect(took?.className).toContain("rdw-groups__item--landed");
    took?.dispatchEvent(new Event("animationend", { bubbles: true }));
  });

  it("moves from one menu: the groups, No group, New group", async () => {
    const onMove = vi.fn();
    const onNew = vi.fn();
    const host = mount(
      <MoveToGroupMenu groups={["Artists", "Characters"]} current="Artists" onMove={onMove} onNew={onNew} />,
    );
    const open = (): void => {
      fireClick(byText(host, "button", "Move to group"));
    };
    open();
    await flushEffects();
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    expect(items.map((node) => node.textContent)).toEqual([
      "Artists",
      "Characters",
      "No group",
      "New group…",
    ]);
    // The group it is in already is ticked and cannot be picked again.
    expect(items[0]).toHaveProperty("disabled", true);
    fireClick(byText(document, '[role="menuitem"]', "Characters"));
    expect(onMove).toHaveBeenLastCalledWith("Characters");
    open();
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "No group"));
    expect(onMove).toHaveBeenLastCalledWith(null);
    open();
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "New group…"));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it("asks a name for a new group and refuses one that is taken", async () => {
    const onCreate = vi.fn();
    const host = mount(
      <GroupDialogs
        request={{ kind: "new", targets: ["alpha"] }}
        groups={["Artists"]}
        countLabel={(count) => `${String(count)} artists`}
        onCreate={onCreate}
        onRename={() => undefined}
        onDelete={() => undefined}
        onClose={() => undefined}
      />,
    );
    await flushEffects();
    const input = document.querySelector('input[aria-label="Group name"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const create = byText(document, "button", "Create");
    expect(create).toHaveProperty("disabled", true);
    setValue(input, "Artists");
    await flushEffects();
    expect(document.body.textContent).toContain("There is a group with this name already.");
    expect(byText(document, "button", "Create")).toHaveProperty("disabled", true);
    // No more than forty characters, and it is said how many there are.
    expect(input.maxLength).toBe(GROUP_NAME_MAX);
    setValue(input, "x".repeat(GROUP_NAME_MAX + 5));
    await flushEffects();
    expect(document.body.textContent).toContain("40 / 40");
    setValue(input, " Painters ");
    await flushEffects();
    fireClick(byText(document, "button", "Create"));
    expect(onCreate).toHaveBeenCalledWith("Painters", ["alpha"]);
    expect(host).toBeInstanceOf(HTMLElement);
  });

  it("says what a deleted group leaves behind", () => {
    expect(deleteGroupMessage("Artists", "3 artists", 3)).toBe(
      "Delete the group “Artists”? Its 3 artists go to No group; nothing else is deleted.",
    );
    expect(deleteGroupMessage("Artists", "1 artist", 1)).toContain("Its 1 artist goes to No group");
    expect(deleteGroupMessage("Empty", "0 artists", 0)).toBe(
      "Delete the group “Empty”? Nothing is in it.",
    );
  });
});
