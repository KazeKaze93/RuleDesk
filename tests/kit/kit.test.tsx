import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "preact/test-utils";

import {
  AutocompleteField,
  Button,
  Card,
  Chip,
  EmptyState,
  IconArrowUp,
  IconButton,
  IconDroplet,
  IconExternalLink,
  IconFlag,
  IconNote,
  IconPencil,
  IconStar,
  NumberField,
  Popover,
  ProgressBar,
  SectionLabel,
  Segmented,
  Select,
  Switch,
  Tabs,
  TextField,
  kitTabId,
  kitTabPanelId,
} from "../../src/ui/kit";
import {
  cleanupKit,
  cleanupKitShadow,
  fireClick,
  flushEffects,
  renderKit,
  renderKitInShadow,
  type KitShadowMount,
} from "./render";

const hosts: HTMLElement[] = [];
const shadowHosts: KitShadowMount[] = [];

afterEach(() => {
  while (hosts.length > 0) {
    const host = hosts.pop();
    if (host !== undefined) {
      cleanupKit(host);
    }
  }
  while (shadowHosts.length > 0) {
    const shadow = shadowHosts.pop();
    if (shadow !== undefined) {
      cleanupKitShadow(shadow);
    }
  }
});

function mount(node: Parameters<typeof renderKit>[0]): HTMLElement {
  const host = renderKit(node);
  hosts.push(host);
  return host;
}

function mountShadow(
  node: Parameters<typeof renderKitInShadow>[0],
): KitShadowMount {
  const mounted = renderKitInShadow(node);
  shadowHosts.push(mounted);
  return mounted;
}

describe("kit components", () => {
  it("Button supports variants, sizes, loading and focus class", () => {
    const onClick = vi.fn();
    const host = mount(
      <Button variant="primary" size="s" loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = host.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.className).toContain("rdw-btn--primary");
    expect(button?.className).toContain("rdw-btn--s");
    expect(button?.getAttribute("aria-busy")).toBe("true");
    expect(button?.disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("IconButton exposes accessible name", () => {
    const host = mount(
      <IconButton label="Favorite">
        <IconStar />
      </IconButton>,
    );
    const button = host.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Favorite");
    expect(button?.getBoundingClientRect().height).toBeGreaterThanOrEqual(0);
  });

  it("Segmented is a radiogroup with keyboard change", () => {
    const onChange = vi.fn();
    const host = mount(
      <Segmented
        label="Media"
        value="images"
        onChange={onChange}
        options={[
          { value: "all", label: "All" },
          { value: "images", label: "Images" },
          { value: "videos", label: "Videos" },
        ]}
      />,
    );
    expect(host.querySelector('[role="radiogroup"]')).toBeTruthy();
    const selected = host.querySelector('[aria-checked="true"]');
    expect(selected?.textContent).toBe("Images");
    act(() => {
      selected?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenCalledWith("videos");
  });

  it("Chip remove button and exclude variant", () => {
    const onRemove = vi.fn();
    const host = mount(
      <Chip label="3d" variant="exclude" onRemove={onRemove} />,
    );
    expect(host.querySelector(".rdw-chip--exclude")).toBeTruthy();
    const remove = host.querySelector("button");
    expect(remove).toBeTruthy();
    if (remove !== null) {
      fireClick(remove);
    }
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("Switch toggles via role=switch", () => {
    const onChange = vi.fn();
    const host = mount(
      <Switch checked={false} label="Search tools" onChange={onChange} />,
    );
    const sw = host.querySelector('[role="switch"]');
    expect(sw?.getAttribute("aria-checked")).toBe("false");
    expect(sw).toBeTruthy();
    if (sw !== null) {
      fireClick(sw);
    }
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("Select closes on Escape and outside click", async () => {
    const onChange = vi.fn();
    const host = mount(
      <Select
        label="Sort"
        value="newest"
        onChange={onChange}
        options={[
          { value: "newest", label: "Newest" },
          { value: "score", label: "Score" },
        ]}
      />,
    );
    const trigger = host.querySelector(".rdw-select__trigger");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error("expected select trigger");
    }
    fireClick(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // On a page of the site the list is drawn in <body>, not inside the block it was opened from.
    expect(host.querySelector('[role="listbox"]')).toBeNull();
    expect(document.body.querySelector(':scope > [role="listbox"]')).toBeTruthy();
    await flushEffects();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  it("Select option click inside shadow root fires onChange", async () => {
    const onChange = vi.fn();
    const { host, shadow } = mountShadow(
      <Select
        label="Sort"
        value="newest"
        onChange={onChange}
        options={[
          { value: "newest", label: "Newest" },
          { value: "score", label: "Score" },
        ]}
      />,
    );
    const trigger = shadow.querySelector(".rdw-select__trigger");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error("expected select trigger");
    }
    fireClick(trigger);
    expect(shadow.querySelector('[role="listbox"]')).toBeTruthy();
    await flushEffects();
    const selectRoot = shadow.querySelector(".rdw-select");
    const option = Array.from(
      shadow.querySelectorAll('[role="option"]'),
    ).find((node) => node.textContent === "Score");
    expect(selectRoot).toBeTruthy();
    expect(option).toBeTruthy();
    if (selectRoot === null || option === undefined) {
      throw new Error("expected select root and Score option");
    }
    // Browser retargets event.target to the shadow host for document listeners;
    // composedPath still includes the real select root. Old contains(target) closed.
    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(event, "target", {
        configurable: true,
        value: host,
      });
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: () => [option, selectRoot, shadow, host, document, window],
      });
      document.dispatchEvent(event);
    });
    expect(shadow.querySelector('[role="listbox"]')).toBeTruthy();
    fireClick(option);
    expect(onChange).toHaveBeenCalledWith("score");
  });

  it("AutocompleteField opens listbox and selects with Enter", async () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const host = mount(
      <AutocompleteField
        label="Artist tag"
        value="ny"
        onChange={onChange}
        onSelect={onSelect}
        suggestions={[
          { label: "nyx_x (2691)", value: "nyx_x", type: "artist" },
          { label: "nyan (10)", value: "nyan", type: "general" },
        ]}
      />,
    );
    await flushEffects();
    const input = host.querySelector('input[role="combobox"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(host.querySelector('[role="listbox"]')).toBeTruthy();
    expect(host.querySelectorAll('[role="option"]').length).toBe(2);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("expected combobox");
    }
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenCalledWith("nyx_x");
    expect(onSelect).toHaveBeenCalledWith({
      label: "nyx_x (2691)",
      value: "nyx_x",
      type: "artist",
    });
    expect(host.querySelector('[role="listbox"]')).toBeNull();
  });

  it("AutocompleteField Escape and outside click close the list", async () => {
    const host = mount(
      <AutocompleteField
        label="Add tag"
        value="ga"
        onChange={() => undefined}
        suggestions={[{ label: "gay (1)", value: "gay" }]}
      />,
    );
    await flushEffects();
    expect(host.querySelector('[role="listbox"]')).toBeTruthy();
    const input = host.querySelector('input[role="combobox"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("expected combobox");
    }
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(host.querySelector('[role="listbox"]')).toBeNull();
  });

  it("AutocompleteField outside mousedown uses composedPath", async () => {
    const { host, shadow } = mountShadow(
      <AutocompleteField
        label="Add tag"
        value="ga"
        onChange={() => undefined}
        suggestions={[{ label: "gay (1)", value: "gay" }]}
      />,
    );
    await flushEffects();
    expect(shadow.querySelector('[role="listbox"]')).toBeTruthy();
    const root = shadow.querySelector(".rdw-ac");
    const option = shadow.querySelector('[role="option"]');
    expect(root).toBeTruthy();
    expect(option).toBeTruthy();
    if (root === null || option === null) {
      throw new Error("expected autocomplete root and option");
    }
    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(event, "target", {
        configurable: true,
        value: host,
      });
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: () => [option, root, shadow, host, document, window],
      });
      document.dispatchEvent(event);
    });
    expect(shadow.querySelector('[role="listbox"]')).toBeTruthy();

    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(event, "target", {
        configurable: true,
        value: host,
      });
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: () => [host, document, window],
      });
      document.dispatchEvent(event);
    });
    expect(shadow.querySelector('[role="listbox"]')).toBeNull();
  });

  it("TextField and NumberField emit changes", () => {
    const onText = vi.fn();
    const onNum = vi.fn();
    const host = mount(
      <>
        <TextField label="Name" value="" onChange={onText} />
        <NumberField label="Score" value={10} onChange={onNum} />
      </>,
    );
    const text = host.querySelector('input[type="text"]');
    const num = host.querySelector('input[type="number"]');
    expect(text).toBeTruthy();
    expect(num).toBeTruthy();
    act(() => {
      if (text instanceof HTMLInputElement) {
        text.value = "nyx";
        text.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (num instanceof HTMLInputElement) {
        num.value = "20";
        num.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    expect(onText).toHaveBeenCalledWith("nyx");
    expect(onNum).toHaveBeenCalledWith(20);
  });

  it("Tabs use tablist semantics with aria-controls and arrow keys", () => {
    const onChange = vi.fn();
    const host = mount(
      <Tabs
        aria-label="Panel"
        value="settings"
        onChange={onChange}
        items={[
          { id: "artists", label: "Artists" },
          { id: "settings", label: "Settings" },
        ]}
      />,
    );
    expect(host.querySelector('[role="tablist"]')).toBeTruthy();
    const artists = host.querySelector(`#${kitTabId("artists")}`);
    const settings = host.querySelector(`#${kitTabId("settings")}`);
    expect(artists).toBeTruthy();
    expect(settings?.getAttribute("aria-controls")).toBe(
      kitTabPanelId("settings"),
    );
    if (artists !== null) {
      fireClick(artists);
    }
    expect(onChange).toHaveBeenCalledWith("artists");

    if (settings instanceof HTMLElement) {
      settings.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowLeft",
          bubbles: true,
        }),
      );
    }
    expect(onChange).toHaveBeenCalledWith("artists");
  });

  it("exports stroke icons used by the post panel", () => {
    const host = mount(
      <div>
        <IconArrowUp />
        <IconDroplet />
        <IconPencil />
        <IconFlag />
        <IconNote />
        <IconExternalLink />
        <IconStar />
      </div>,
    );
    expect(host.querySelectorAll("svg")).toHaveLength(7);
  });

  it("Card, SectionLabel, EmptyState render", () => {
    const host = mount(
      <Card>
        <SectionLabel>Appearance</SectionLabel>
        <EmptyState title="Nothing here" description="Add items" />
      </Card>,
    );
    expect(host.querySelector(".rdw-card")).toBeTruthy();
    expect(host.textContent).toContain("Appearance");
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      "Nothing here",
    );
  });

  it("Popover closes on Escape and outside click", async () => {
    const onClose = vi.fn();
    const host = mount(
      <div>
        <Popover open onClose={onClose} aria-label="Collections">
          <div>Menu</div>
        </Popover>
      </div>,
    );
    expect(host.querySelector('[role="dialog"]')).toBeTruthy();
    await flushEffects();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("Popover inside click in shadow root does not call onClose", async () => {
    const onClose = vi.fn();
    const { host, shadow } = mountShadow(
      <Popover open onClose={onClose} aria-label="Collections">
        <button type="button">Inside</button>
      </Popover>,
    );
    const dialog = shadow.querySelector('[role="dialog"]');
    const inside = shadow.querySelector("button");
    expect(dialog).toBeTruthy();
    expect(inside).toBeTruthy();
    await flushEffects();
    if (dialog === null || inside === null) {
      throw new Error("expected dialog and inside button");
    }
    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        composed: true,
      });
      Object.defineProperty(event, "target", {
        configurable: true,
        value: host,
      });
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: () => [inside, dialog, shadow, host, document, window],
      });
      document.dispatchEvent(event);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ProgressBar exposes progressbar role", async () => {
    const host = mount(<ProgressBar value={0.5} label="Sync" />);
    await flushEffects();
    const bar = host.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute("aria-valuenow")).toBe("50");
  });

  it("ProgressBar without value is empty; waiting needs explicit flag", async () => {
    const emptyHost = mount(<ProgressBar label="Idle" />);
    await flushEffects();
    const emptyFill = emptyHost.querySelector(".rdw-progress__fill");
    expect(emptyFill?.className).toBe("rdw-progress__fill");
    expect(emptyFill?.className).not.toContain(
      "rdw-progress__fill--indeterminate",
    );
    expect(
      emptyHost.querySelector('[role="progressbar"]')?.getAttribute(
        "aria-valuenow",
      ),
    ).toBeNull();

    const waitingHost = mount(<ProgressBar waiting label="Wait" />);
    await flushEffects();
    const waitingFill = waitingHost.querySelector(".rdw-progress__fill");
    expect(waitingFill?.className).toContain(
      "rdw-progress__fill--indeterminate",
    );
  });

  it("kit CSS uses only rdw token variables for colors", () => {
    const host = mount(<Button variant="danger">Delete</Button>);
    const styles = Array.from(host.querySelectorAll("style:not([data-rdw-tokens])"))
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(styles).toContain("var(--rdw-danger)");
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
