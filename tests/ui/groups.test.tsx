import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GROUP_ALL,
  GROUP_NONE,
  GROUPS_CSS,
  GroupDialogs,
  GroupTabs,
  MoveToGroupMenu,
  countGroups,
  deleteGroupMessage,
  inGroupTab,
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
        groups={[{ name: "Artists", count: 2 }]}
        value={GROUP_ALL}
        onChange={() => undefined}
        onNew={() => undefined}
        onRename={onRename}
        onDelete={onDelete}
      />,
    );
    const more = host.querySelector('button[aria-label="Actions of the group Artists"]');
    expect(more).toBeInstanceOf(HTMLButtonElement);
    // The button is a part of the tab and is not hidden until the pointer comes.
    expect(GROUPS_CSS).not.toContain("opacity: 0;");
    if (more instanceof HTMLButtonElement) {
      fireClick(more);
    }
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "Rename"));
    expect(onRename).toHaveBeenCalledWith("Artists");
    if (more instanceof HTMLButtonElement) {
      fireClick(more);
    }
    await flushEffects();
    fireClick(byText(document, '[role="menuitem"]', "Delete"));
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
