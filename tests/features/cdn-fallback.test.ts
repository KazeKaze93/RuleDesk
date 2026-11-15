import { afterEach, describe, expect, it } from "vitest";

import { cdnFallbackFeature, nextCdnUrl } from "../../src/features/cdn-fallback";
import type { FeatureContext } from "../../src/features/types";

const SAMPLE = "https://wimg.rule34.xxx//samples/12/sample_abc.jpg?5";

function ctx(): FeatureContext {
  return {
    pageKind: "post",
    search: "?page=post&s=view&id=5",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

describe("cdn fallback", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("offers the same file on the next untried server and nothing for a foreign address", () => {
    expect(nextCdnUrl(SAMPLE, new Set(["wimg.rule34.xxx"]))).toBe(
      "https://img.rule34.xxx//samples/12/sample_abc.jpg?5",
    );
    expect(
      nextCdnUrl(
        "https://img.rule34.xxx//samples/12/sample_abc.jpg?5",
        new Set(["wimg.rule34.xxx", "img.rule34.xxx"]),
      ),
    ).toBe("https://us.rule34.xxx//samples/12/sample_abc.jpg?5");
    expect(nextCdnUrl("https://example.test/a.jpg", new Set())).toBeNull();
    expect(
      nextCdnUrl(
        SAMPLE,
        new Set(["wimg.rule34.xxx", "img.rule34.xxx", "us.rule34.xxx", "api-cdn.rule34.xxx"]),
      ),
    ).toBeNull();
  });

  it("walks the servers on load errors and then stops", () => {
    const image = document.createElement("img");
    image.id = "image";
    image.setAttribute("src", SAMPLE);
    document.body.append(image);
    cdnFallbackFeature.mount(ctx());

    const hosts: string[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      image.dispatchEvent(new Event("error"));
      hosts.push(new URL(image.src).hostname);
    }
    expect(hosts).toEqual([
      "img.rule34.xxx",
      "us.rule34.xxx",
      "api-cdn.rule34.xxx",
      "api-cdn.rule34.xxx",
      "api-cdn.rule34.xxx",
      "api-cdn.rule34.xxx",
    ]);
  });
});
