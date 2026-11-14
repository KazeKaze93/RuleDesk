import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTOCOMPLETE_DEBOUNCE_MS } from "../../src/site/autocomplete";
import { Dialog } from "../../src/ui/kit";
import {
  completeLastQueryToken,
  QueryField,
  readLastQueryToken,
} from "../../src/ui/query-field";
import { cleanupKit, fireClick, renderKit } from "../kit/render";

const FIELD_ID = "query-under-test";

function Harness(props: { readonly initial: string }): JSX.Element {
  const [value, setValue] = useState(props.initial);
  return <QueryField id={FIELD_ID} label="Query" value={value} onChange={setValue} />;
}

function DialogHarness(props: { readonly onClose: () => void }): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <Dialog open onClose={props.onClose} title="Edit">
      <QueryField id={FIELD_ID} label="Query" value={value} onChange={setValue} />
    </Dialog>
  );
}

function input(): HTMLInputElement {
  const node = document.getElementById(FIELD_ID);
  if (!(node instanceof HTMLInputElement)) {
    throw new Error("query input missing");
  }
  return node;
}

function type(value: string): void {
  const node = input();
  act(() => {
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function options(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
}

function stubFetch(items: readonly { label: string; value: string }[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(items), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function passDebounce(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTOCOMPLETE_DEBOUNCE_MS);
  });
}

function requestedQuery(fetchMock: ReturnType<typeof vi.fn>): string | null {
  const url = fetchMock.mock.calls.at(-1)?.[0];
  if (typeof url !== "string") {
    return null;
  }
  return new URL(url).searchParams.get("q");
}

describe("query token helpers", () => {
  it("reads the tag being typed, keeping an exclusion prefix", () => {
    expect(readLastQueryToken("futa bios")).toEqual({
      head: "futa ",
      prefix: "",
      stem: "bios",
    });
    expect(readLastQueryToken("futa -bios")).toEqual({
      head: "futa ",
      prefix: "-",
      stem: "bios",
    });
  });

  it("has no tag after a space, on search syntax, or on a filter", () => {
    expect(readLastQueryToken("")).toBeNull();
    expect(readLastQueryToken("futa ")).toBeNull();
    expect(readLastQueryToken("( cat ~")).toBeNull();
    expect(readLastQueryToken("cat (")).toBeNull();
    expect(readLastQueryToken("cat sort:ran")).toBeNull();
    expect(readLastQueryToken("cat score:>=10")).toBeNull();
  });

  it("replaces only the last token and leaves room for the next", () => {
    expect(completeLastQueryToken("futa bios", "bioshock")).toBe("futa bioshock ");
    expect(completeLastQueryToken("( cat ~ do", "dog")).toBe("( cat ~ dog ");
    expect(completeLastQueryToken("cat -do", "dog")).toBe("cat -dog ");
  });
});

describe("QueryField", () => {
  let host: HTMLElement | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.replaceChildren();
  });

  afterEach(() => {
    if (host !== null) {
      cleanupKit(host);
      host = null;
    }
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks the site for the last token only and completes it on pick", async () => {
    const fetchMock = stubFetch([
      { label: "bioshock (100)", value: "bioshock" },
      { label: "bioshock_infinite (50)", value: "bioshock_infinite" },
    ]);
    host = renderKit(<Harness initial="" />);

    type("futa bios");
    expect(fetchMock).not.toHaveBeenCalled();
    await passDebounce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedQuery(fetchMock)).toBe("bios");
    expect(options().map((node) => node.textContent)).toEqual([
      "bioshock (100)",
      "bioshock_infinite (50)",
    ]);

    const second = options()[1];
    if (second === undefined) {
      throw new Error("option missing");
    }
    fireClick(second);
    expect(input().value).toBe("futa bioshock_infinite ");
    expect(options()).toHaveLength(0);
    await passDebounce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps typed text that equals a suggestion", async () => {
    stubFetch([{ label: "cat (9)", value: "cat" }]);
    host = renderKit(<Harness initial="" />);
    type("ca");
    await passDebounce();
    type("cat");
    expect(input().value).toBe("cat");
  });

  it("sends nothing for syntax, filters, and one-letter tokens", async () => {
    const fetchMock = stubFetch([]);
    host = renderKit(<Harness initial="" />);
    for (const text of ["cat (", "cat sort:ran", "cat ", "cat d"]) {
      type(text);
      await passDebounce();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("closes the suggestion list on the first Escape and the dialog on the second", async () => {
    stubFetch([{ label: "cat (9)", value: "cat" }]);
    const onClose = vi.fn();
    host = renderKit(<DialogHarness onClose={onClose} />);
    type("ca");
    await passDebounce();
    expect(options()).toHaveLength(1);

    const escape = (): void => {
      act(() => {
        input().dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      });
    };
    escape();
    expect(options()).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
    escape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
