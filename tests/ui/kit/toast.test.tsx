import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toast, TOAST_AUTO_HIDE_MS } from "../../../src/ui/kit/toast";
import { cleanupKit, fireClick, flushEffects, renderKit } from "../../kit/render";

const hosts: HTMLElement[] = [];

afterEach(() => {
  vi.useRealTimers();
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

describe("Toast", () => {
  it("pins the auto-hide delay at 6 seconds", () => {
    expect(TOAST_AUTO_HIDE_MS).toBe(6000);
  });

  it("renders one bottom-center status strip with an optional action", async () => {
    const onAction = vi.fn();
    const host = mount(
      <Toast
        open
        message="Saved"
        onClose={() => undefined}
        action={{ label: "Undo", onClick: onAction }}
      />,
    );
    await flushEffects();

    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.textContent).toContain("Saved");

    const style = [...host.querySelectorAll("style")].find((node) =>
      (node.textContent ?? "").includes(".rdw-toast"),
    );
    expect(style?.textContent).toContain("left: 50%");
    expect(style?.textContent).toContain("bottom:");
    expect(style?.textContent).toContain("translateX(-50%)");

    const undo = [...host.querySelectorAll("button")].find(
      (node) => node.textContent === "Undo",
    );
    expect(undo).toBeInstanceOf(HTMLButtonElement);
    if (undo !== undefined) {
      fireClick(undo);
    }
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("hides after the auto-hide delay and stays up until then", async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const host = mount(<HideHarness onClose={onClose} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(host.querySelector('[role="status"]')).not.toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(TOAST_AUTO_HIDE_MS - 1);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(host.querySelector('[role="status"]')).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[role="status"]')).toBeNull();
  });

  it("shows only the latest toast", async () => {
    const onCloseFirst = vi.fn();
    const onCloseSecond = vi.fn();
    const host = mount(
      <div>
        <Toast open message="First" onClose={onCloseFirst} />
        <Toast open message="Second" onClose={onCloseSecond} />
      </div>,
    );
    await flushEffects();

    const statuses = [...host.querySelectorAll('[role="status"]')];
    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.textContent).toContain("Second");
    expect(onCloseFirst).toHaveBeenCalledTimes(1);
    expect(onCloseSecond).not.toHaveBeenCalled();
  });
});

function HideHarness(props: { readonly onClose: () => void }): JSX.Element {
  const [open, setOpen] = useState(true);
  return (
    <Toast
      open={open}
      message="Saved"
      onClose={() => {
        props.onClose();
        setOpen(false);
      }}
    />
  );
}
