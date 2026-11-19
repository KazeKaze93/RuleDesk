import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIRST_SHOWN,
  LIMITED_WAIT_S,
  MoreLikeThis,
  fewTagsText,
  moreLikeThisFeature,
  sharedTagsText,
  type MoreLikeThisProps,
} from "../../src/features/more-like-this";
import {
  RelatedError,
  favoriteCandidates,
  rankCandidates,
  readCandidates,
  readPostTags,
  relatedSearchUrl,
  relatedSources,
  type PostTag,
  type RankedPost,
} from "../../src/site/related";

/** The tag list beside a post (rows as on the site: "? tag count"). */
const SIDEBAR = `
<ul id="tag-sidebar">
<li><h6>Artist</h6></li>
<li class="tag-type-artist tag"><a href="index.php?page=wiki&amp;s=list&amp;search=esqeazy">?</a> <a href="index.php?page=post&amp;s=list&amp;tags=esqeazy">esqeazy</a> <span class="tag-count">410</span></li>
<li class="tag-type-character tag"><a href="index.php?page=post&amp;s=list&amp;tags=jessica_rabbit">jessica rabbit</a> <span class="tag-count">9000</span></li>
<li class="tag-type-copyright tag"><a href="index.php?page=post&amp;s=list&amp;tags=disney">disney</a> <span class="tag-count">200000</span></li>
<li class="tag-type-general tag"><a href="index.php?page=post&amp;s=list&amp;tags=red_dress">red dress</a> <span class="tag-count">30000</span></li>
<li class="tag-type-general tag"><a href="index.php?page=post&amp;s=list&amp;tags=1girls">1girls</a> <span class="tag-count">5000000</span></li>
<li class="tag-type-metadata tag"><a href="index.php?page=post&amp;s=list&amp;tags=hi_res">hi res</a> <span class="tag-count">900000</span></li>
</ul>`;

const RESULTS = `
<div id="post-list"><div class="content"><div class="image-list">
<span class="thumb" id="s11"><a id="p11" href="index.php?page=post&amp;s=view&amp;id=11"><img class="preview" src="https://wimg.example/t11.jpg" alt="esqeazy 1girls" title="esqeazy 1girls score:3 rating:explicit"></a></span>
<span class="thumb" id="s12"><a id="p12" href="index.php?page=post&amp;s=view&amp;id=12"><img class="preview webm-thumb" src="https://wimg.example/t12.jpg" alt="x" title="esqeazy jessica_rabbit red_dress score:9 rating:explicit"></a></span>
<span class="thumb" id="s100"><a id="p100" href="index.php?page=post&amp;s=view&amp;id=100"><img class="preview" src="https://wimg.example/t100.jpg" alt="x" title="esqeazy jessica_rabbit red_dress 1girls score:1 rating:explicit"></a></span>
</div></div></div>`;

function postTags(): PostTag[] {
  document.body.innerHTML = SIDEBAR;
  return readPostTags(document);
}

function ranked(id: number, shared: number = 3, video: boolean = false): RankedPost {
  return { id, thumb: `https://wimg.example/t${String(id)}.jpg`, tags: [], video, shared, score: shared };
}

let host: HTMLElement;

beforeEach(() => {
  host = document.createElement("div");
});

afterEach(() => {
  render(null, host);
  vi.useRealTimers();
});

async function mount(over: Partial<MoreLikeThisProps> = {}): Promise<MoreLikeThisProps> {
  const tags = over.tags ?? postTags();
  const props: MoreLikeThisProps = {
    postId: 100,
    tags,
    lastKind: null,
    onPick: vi.fn(),
    readFavorites: () => Promise.resolve([ranked(7), ranked(8)]),
    load: vi.fn(() => Promise.resolve([ranked(11), ranked(12, 5, true)])),
    ...over,
  };
  document.body.append(host);
  await act(async () => {
    render(<MoreLikeThis {...props} />, host);
  });
  return props;
}

function tabs(): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
}

async function press(element: Element | undefined): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("reading the post and its candidates", () => {
  it("reads the tags of the post with their kinds and counts", () => {
    expect(postTags()).toEqual([
      { tag: "esqeazy", kind: "artist", count: 410 },
      { tag: "jessica_rabbit", kind: "character", count: 9000 },
      { tag: "disney", kind: "copyright", count: 200000 },
      { tag: "red_dress", kind: "general", count: 30000 },
      { tag: "1girls", kind: "general", count: 5000000 },
      { tag: "hi_res", kind: "metadata", count: 900000 },
    ]);
  });

  it("offers the artists, then the characters, then the favorites", () => {
    expect(relatedSources(postTags()).map((source) => [source.kind, source.name, source.query])).toEqual([
      ["artist", "esqeazy", "esqeazy"],
      ["character", "jessica rabbit", "jessica_rabbit"],
      ["favorites", "In your favorites", ""],
    ]);
  });

  it("searches by the rarest tags of a post that names nobody", () => {
    const tags = postTags().filter((tag) => tag.kind !== "artist" && tag.kind !== "character");
    const sources = relatedSources(tags);
    expect(sources.map((source) => source.kind)).toEqual(["shared", "favorites"]);
    // The two rarest, and never a tag about the file.
    expect(sources[0]?.tags).toEqual(["red_dress", "disney"]);
    expect(sources[0]?.query).toBe("red_dress disney");
    expect(relatedSearchUrl("red_dress disney")).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=red_dress+disney",
    );
  });

  it("reads a page of a search and puts the most alike first, without the post itself", () => {
    const tags = postTags();
    const doc = new DOMParser().parseFromString(RESULTS, "text/html");
    const candidates = readCandidates(doc);
    expect(candidates.map((post) => [post.id, post.video])).toEqual([
      [11, false],
      [12, true],
      [100, false],
    ]);
    const order = rankCandidates(tags, candidates, 100);
    expect(order.map((post) => [post.id, post.shared])).toEqual([
      [12, 3],
      [11, 2],
    ]);
    // A rare tag counts for more than a common one.
    const rare = rankCandidates(
      tags,
      [
        { id: 1, thumb: "a", tags: ["1girls", "hi_res"], video: false },
        { id: 2, thumb: "b", tags: ["esqeazy"], video: false },
      ],
      100,
    );
    expect(rare.map((post) => post.id)).toEqual([2, 1]);
  });

  it("finds the favorites that share an artist or a character with the post", () => {
    const tags = postTags();
    const entry = (id: number, list: string): { id: number; tags: string; thumb: string; run: number; pos: number } => ({
      id,
      tags: list,
      thumb: `https://wimg.example/f${String(id)}.jpg`,
      run: 1,
      pos: id,
    });
    const like = favoriteCandidates(
      [
        entry(1, "esqeazy red_dress"),
        entry(2, "red_dress 1girls disney"),
        entry(3, "jessica_rabbit"),
        entry(100, "esqeazy jessica_rabbit"),
      ],
      tags,
      100,
    );
    expect(like.map((post) => post.id)).toEqual([1, 3]);
  });
});

describe("the block under the picture", () => {
  it("shows only the sources before one is picked, with the count of the favorites", async () => {
    const props = await mount({ lastKind: "character" });
    expect(host.querySelector(".rdw-mlt-title")?.textContent).toBe("More like this");
    expect(tabs().map((tab) => tab.textContent)).toEqual([
      "esqeazy",
      "jessica rabbit",
      "In your favorites2",
    ]);
    expect(host.textContent).toContain("Pick a source to load up to 42 posts, most similar first.");
    expect(host.querySelector(".rdw-mlt-grid")).toBeNull();
    expect(props.load).not.toHaveBeenCalled();
    // The kind picked on the post before is marked, and not loaded.
    expect(tabs()[1]?.hasAttribute("data-last")).toBe(true);
    expect(tabs()[0]?.getAttribute("title")).toBe("Artist");
  });

  it("loads a source when it is picked, once, and keeps it", async () => {
    const props = await mount();
    await press(tabs()[0]);
    expect(props.load).toHaveBeenCalledTimes(1);
    expect(props.load).toHaveBeenCalledWith("esqeazy");
    expect(props.onPick).toHaveBeenCalledWith("artist");
    const cells = [...host.querySelectorAll("a.rdw-mlt-cell")];
    expect(cells.map((cell) => cell.getAttribute("href"))).toEqual([
      "index.php?page=post&s=view&id=11",
      "index.php?page=post&s=view&id=12",
    ]);
    expect(cells[1]?.getAttribute("title")).toBe("5 shared tags");
    expect(cells[1]?.querySelector(".rdw-mlt-video")).not.toBeNull();
    expect(cells[0]?.querySelector("img")?.getAttribute("alt")).toBe("esqeazy #11");
    expect(tabs()[0]?.textContent).toBe("esqeazy2");
    expect(host.querySelector('a.rdw-mlt-link[href*="tags=esqeazy"]')?.textContent).toBe(
      "Search esqeazy →",
    );
    // The favorites need no request; coming back to the artist makes none either.
    await press(tabs()[2]);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(2);
    await press(tabs()[0]);
    expect(props.load).toHaveBeenCalledTimes(1);
  });

  it("shows eight at first and the rest in place", async () => {
    const many = Array.from({ length: 12 }, (_unused, index) => ranked(index + 1));
    await mount({ load: () => Promise.resolve(many) });
    await press(tabs()[0]);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(FIRST_SHOWN);
    const all = [...host.querySelectorAll("button.rdw-mlt-link")].find(
      (button) => button.textContent === "Show all 12",
    );
    await press(all);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(12);
  });

  it("says so when nothing came, and why when the site did not answer", async () => {
    await mount({ load: () => Promise.resolve([]) });
    await press(tabs()[0]);
    expect(host.textContent).toContain("No other posts by esqeazy.");
    render(null, host);

    const load = vi
      .fn<(query: string) => Promise<RankedPost[]>>()
      .mockRejectedValueOnce(new RelatedError("offline", "x"))
      .mockResolvedValueOnce([ranked(11)]);
    await mount({ load });
    await press(tabs()[0]);
    expect(host.textContent).toContain("Couldn't load: no connection.");
    const retry = [...host.querySelectorAll("button.rdw-mlt-link")].find(
      (button) => button.textContent === "Try again",
    );
    await press(retry);
    expect(load).toHaveBeenCalledTimes(2);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(1);
  });

  it("makes the retry wait a minute after the site asked to slow down", async () => {
    vi.useFakeTimers();
    let clock = 0;
    await mount({
      load: () => Promise.reject(new RelatedError("limited", "HTTP 429")),
      now: () => clock,
    });
    await press(tabs()[0]);
    expect(host.textContent).toContain("The site asked to slow down. Try again in a minute.");
    const retry = host.querySelector<HTMLButtonElement>("p[role='alert'] button.rdw-mlt-link");
    expect(retry?.disabled).toBe(true);
    expect(retry?.textContent).toBe(`Try again (${String(LIMITED_WAIT_S)})`);
    // The button counts the seconds down and comes back when they are out.
    clock = LIMITED_WAIT_S * 1000;
    // The effect that starts the countdown is run by the clock of the test.
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(host.querySelector<HTMLButtonElement>("p[role='alert'] button.rdw-mlt-link")?.disabled).toBe(
      false,
    );
  });

  it("keeps the favorites off when none is like the post, and is honest about a post with few tags", async () => {
    await mount({ readFavorites: () => Promise.resolve([]) });
    const favorites = tabs()[2];
    expect(favorites?.disabled).toBe(true);
    expect(favorites?.getAttribute("title")).toBe(
      "None of your favorites share tags with this post.",
    );
    await press(tabs()[0]);
    // Six tags on the post: the list is shown, with a line that says it is weak.
    expect(host.textContent).toContain("Few shared tags — this post has only 6 tags.");
    expect(fewTagsText(1)).toBe("Few shared tags — this post has only 1 tag.");
    expect(sharedTagsText(1)).toBe("1 shared tag");
  });

  it("is a feature of the post page that is on unless turned off, and keeps to its own block", () => {
    expect(moreLikeThisFeature.pages).toEqual(["post"]);
    expect(moreLikeThisFeature.defaultEnabled).toBe(true);
    expect(moreLikeThisFeature.label).toBe("More like this");
    expect(moreLikeThisFeature.settingsCaption).toBe(
      "Under the picture. Loads posts only when you pick a source: one request per source.",
    );
    // As wide as the picture's column, and never the cause of its width.
    expect(moreLikeThisFeature.css).toMatch(/#rdw-more-like-this \{[^}]*width: 0;\s*min-width: 100%;/);
  });
});
