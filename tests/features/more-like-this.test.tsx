import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIRST_SHOWN,
  LIMITED_WAIT_S,
  MoreLikeThis,
  fewTagsText,
  fewerTagsText,
  firstSource,
  SOURCE_ROWS_MAX,
  moreLikeThisFeature,
  rowsOf,
  sharedTagsText,
  shownTagSources,
  type MoreLikeThisProps,
} from "../../src/features/more-like-this";
import {
  RelatedError,
  decodeTagEntities,
  favoriteCandidates,
  rankCandidates,
  readCandidates,
  readPostTags,
  loadByFewerTags,
  relatedQuery,
  relatedSearchUrl,
  relatedSources,
  similarTags,
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
<li class="tag-type-general tag"><a href="index.php?page=post&amp;s=list&amp;tags=fairy">fairy</a> <span class="tag-count">900</span></li>
<li class="tag-type-general tag"><a href="index.php?page=post&amp;s=list&amp;tags=size_difference">size difference</a> <span class="tag-count">70000</span></li>
<li class="tag-type-general tag"><a href="index.php?page=post&amp;s=list&amp;tags=own_tag_of_the_artist">own tag</a> <span class="tag-count">3</span></li>
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
    tags,
    lastKind: null,
    onPick: vi.fn(),
    readFavorites: () => Promise.resolve([ranked(7), ranked(8)]),
    load: vi.fn(() => Promise.resolve([ranked(11), ranked(12, 5, true)])),
    pause: () => Promise.resolve(),
    ...over,
  };
  document.body.append(host);
  await act(async () => {
    render(<MoreLikeThis {...props} />, host);
  });
  await settle();
  return props;
}

/** The buttons of the switch of sources. */
function tabs(): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>(".rdw-mlt-sources button")];
}

/** Lets a search and the searches by fewer tags that may follow it come to their end. */
async function settle(): Promise<void> {
  await act(async () => {
    for (let turn = 0; turn < 20; turn += 1) {
      await Promise.resolve();
    }
  });
}

async function press(element: Element | undefined): Promise<void> {
  await act(async () => {
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await settle();
}

describe("reading the post and its candidates", () => {
  it("reads the tags of the post with their kinds and counts", () => {
    expect(postTags().map((tag) => [tag.tag, tag.kind, tag.count])).toEqual([
      ["esqeazy", "artist", 410],
      ["jessica_rabbit", "character", 9000],
      ["disney", "copyright", 200000],
      ["red_dress", "general", 30000],
      ["fairy", "general", 900],
      ["size_difference", "general", 70000],
      ["own_tag_of_the_artist", "general", 3],
      ["1girls", "general", 5000000],
      ["hi_res", "metadata", 900000],
    ]);
  });

  it("reads a tag with an apostrophe as the tag, not as the code the site writes into the link", () => {
    document.body.innerHTML =
      '<ul id="tag-sidebar"><li class="tag-type-copyright tag"><a href="index.php?page=post&amp;s=list&amp;tags=shadowheart_%28baldur%26%23039%3Bs_gate%29">shadowheart</a> <span class="tag-count">41</span></li></ul>';
    expect(readPostTags(document)[0]?.tag).toBe("shadowheart_(baldur's_gate)");
    expect(decodeTagEntities("a&amp;b&#039;c")).toBe("a&b'c");
    // The switch of sources is as tall as its rows: a second row is not behind the grid.
    expect(moreLikeThisFeature.css).toMatch(/\.rdw-mlt-sources \{[^}]*flex-wrap: wrap;[^}]*height: auto;/);
  });

  it("offers Similar first, then the characters, then the favorites, and no artist", () => {
    const sources = relatedSources(postTags());
    expect(sources.map((source) => [source.kind, source.name])).toEqual([
      ["similar", "Similar"],
      ["character", "jessica rabbit"],
      ["favorites", "In your favorites"],
    ]);
    // The rarest tags that say what is in the picture: no tag about the file,
    // none so rare that it is one artist's own, none that is on every post.
    expect(similarTags(postTags())).toEqual(["fairy", "red_dress", "size_difference"]);
    // The posts of the artist of the post are left out of both searches.
    expect(relatedQuery(sources[0]?.tags ?? [], sources[0]?.without ?? [])).toBe(
      "fairy red_dress size_difference -esqeazy",
    );
    expect(relatedQuery(sources[1]?.tags ?? [], sources[1]?.without ?? [])).toBe(
      "jessica_rabbit -esqeazy",
    );
    expect(relatedSearchUrl("fairy -esqeazy")).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=fairy+-esqeazy",
    );
  });

  it("searches by fewer tags when all of them find nothing, the rarest kept", async () => {
    const asked: string[] = [];
    const pause = vi.fn(() => Promise.resolve());
    const result = await loadByFewerTags(
      ["a", "b", "c"],
      ["x"],
      (query) => {
        asked.push(query);
        return Promise.resolve(query === "a -x" ? [ranked(5)] : []);
      },
      pause,
    );
    expect(asked).toEqual(["a b c -x", "a b -x", "a -x"]);
    expect(pause).toHaveBeenCalledTimes(2);
    expect(result.used).toEqual(["a"]);
    expect(result.posts.map((post) => post.id)).toEqual([5]);
    expect(fewerTagsText(3, 1)).toBe(
      "Few posts with all 3 tags \u2014 showing posts with 1 of them.",
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

describe("the tab of the panel", () => {
  it("loads Similar as soon as it is opened, with nothing to press", async () => {
    const props = await mount();
    expect(props.load).toHaveBeenCalledTimes(1);
    expect(props.load).toHaveBeenCalledWith("fairy red_dress size_difference -esqeazy");
    // Opening is not a choice of a source: nothing is remembered for it.
    expect(props.onPick).not.toHaveBeenCalled();
    // No artist among the sources, no numbers on the tags; the favorites are counted and last.
    expect(tabs().map((tab) => tab.textContent)).toEqual([
      "Similar",
      "jessica rabbit",
      "Favorites 2",
    ]);
    const cells = [...host.querySelectorAll("a.rdw-mlt-cell")];
    expect(cells.map((cell) => cell.getAttribute("href"))).toEqual([
      "index.php?page=post&s=view&id=11",
      "index.php?page=post&s=view&id=12",
    ]);
    expect(cells[1]?.getAttribute("title")).toBe("5 shared tags");
    expect(cells[1]?.querySelector(".rdw-mlt-video")).not.toBeNull();
    expect(host.querySelector("a.rdw-mlt-link")?.textContent).toBe("Search these tags \u2192");
    expect(host.querySelector("a.rdw-mlt-link")?.getAttribute("href")).toContain(
      "tags=fairy+red_dress+size_difference+-esqeazy",
    );
  });

  it("shows the tags Similar searched by, and searches anew when one is taken out", async () => {
    const props = await mount();
    const chips = (): HTMLButtonElement[] => [
      ...host.querySelectorAll<HTMLButtonElement>("button.rdw-mlt-tag"),
    ];
    expect(chips().map((chip) => chip.querySelector(".rdw-chip")?.textContent)).toEqual([
      "fairy",
      "red dress",
      "size difference",
    ]);
    expect(chips().every((chip) => chip.getAttribute("aria-pressed") === "true")).toBe(true);
    await press(chips()[1]);
    expect(props.load).toHaveBeenLastCalledWith("fairy size_difference -esqeazy");
    expect(chips()[1]?.getAttribute("aria-pressed")).toBe("false");
    // Back in: what that search gave is still there, nothing is asked again.
    await press(chips()[1]);
    expect(props.load).toHaveBeenCalledTimes(2);
    // A search needs a tag to be by: the last one cannot be taken out.
    await press(chips()[0]);
    await press(chips()[1]);
    expect(chips()[2]?.disabled).toBe(true);
    // The tags are of Similar only.
    await press(tabs()[1]);
    expect(chips()).toHaveLength(0);
  });

  it("says so when the search was by fewer tags than it began with", async () => {
    const load = vi.fn((query: string) =>
      Promise.resolve(query === "fairy red_dress -esqeazy" ? [ranked(11)] : []),
    );
    await mount({ load });
    expect(load).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain(
      "Few posts with all 3 tags \u2014 showing posts with 2 of them.",
    );
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(1);
  });

  it("keeps the switch to two rows: the rest are behind +N, the picked one always in sight", () => {
    const sources = relatedSources(postTags()).filter((source) => source.kind !== "favorites");
    const five = [
      ...sources,
      { ...sources[1]!, key: "character:b", name: "b" },
      { ...sources[1]!, key: "character:c", name: "c" },
      { ...sources[1]!, key: "character:d", name: "d" },
    ];
    expect(rowsOf([0, 0, 28, 28, 56])).toBe(3);
    expect(SOURCE_ROWS_MAX).toBe(2);
    expect(shownTagSources(five, null, null).map((source) => source.name)).toHaveLength(5);
    expect(shownTagSources(five, 3, null).map((source) => source.name)).toEqual([
      "Similar",
      "jessica rabbit",
      "b",
    ]);
    // One picked from the rest takes the last place.
    expect(shownTagSources(five, 3, "character:d").map((source) => source.name)).toEqual([
      "Similar",
      "jessica rabbit",
      "d",
    ]);
    // As wide as their words, not shares of the row.
    expect(moreLikeThisFeature.css).toMatch(/\.rdw-seg__btn \{[^}]*flex: 0 1 auto;/);
  });

  it("opens on the kind of source picked last, where the post has one", async () => {
    const sources = relatedSources(postTags());
    expect(firstSource(sources, null)?.kind).toBe("similar");
    expect(firstSource(sources, "character")?.name).toBe("jessica rabbit");
    const props = await mount({ lastKind: "character" });
    expect(props.load).toHaveBeenCalledWith("jessica_rabbit -esqeazy");
    render(null, host);
    // The favorites need no request at all.
    const quiet = await mount({ lastKind: "favorites" });
    expect(quiet.load).not.toHaveBeenCalled();
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(2);
  });

  it("loads another source when it is picked, once, and keeps both", async () => {
    const props = await mount();
    await press(tabs()[1]);
    expect(props.load).toHaveBeenCalledTimes(2);
    expect(props.load).toHaveBeenLastCalledWith("jessica_rabbit -esqeazy");
    expect(props.onPick).toHaveBeenLastCalledWith("character");
    await press(tabs()[2]);
    await press(tabs()[0]);
    await press(tabs()[1]);
    expect(props.load).toHaveBeenCalledTimes(2);
  });

  it("shows six at first and the rest in place", async () => {
    const many = Array.from({ length: 12 }, (_unused, index) => ranked(index + 1));
    await mount({ load: () => Promise.resolve(many) });
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(FIRST_SHOWN);
    expect(FIRST_SHOWN).toBe(6);
    const all = [...host.querySelectorAll("button.rdw-mlt-link")].find(
      (button) => button.textContent === "Show all 12",
    );
    await press(all);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(12);
  });

  it("says so when nothing came, and why when the site did not answer", async () => {
    await mount({ load: () => Promise.resolve([]) });
    expect(host.textContent).toContain("No posts by other artists with these tags.");
    render(null, host);

    const load = vi
      .fn<(query: string) => Promise<RankedPost[]>>()
      .mockRejectedValueOnce(new RelatedError("offline", "x"))
      .mockResolvedValueOnce([ranked(11)]);
    await mount({ load });
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

  it("is honest about favorites that are not alike and about a post with few tags", async () => {
    await mount({ readFavorites: () => Promise.resolve([]) });
    expect(tabs()[2]?.textContent).toBe("Favorites 0");
    // Nine tags on the post: the list is shown, with a line that says it is weak.
    expect(host.textContent).toContain("Few shared tags \u2014 this post has only 9 tags.");
    await press(tabs()[2]);
    expect(host.textContent).toContain("None of your favorites share tags with this post.");
    expect(fewTagsText(1)).toBe("Few shared tags \u2014 this post has only 1 tag.");
    expect(sharedTagsText(1)).toBe("1 shared tag");
  });

  it("is a setting of the post page that is on unless turned off", () => {
    expect(moreLikeThisFeature.pages).toEqual(["post"]);
    expect(moreLikeThisFeature.defaultEnabled).toBe(true);
    expect(moreLikeThisFeature.label).toBe("Related Posts tab");
    expect(moreLikeThisFeature.settingsCaption).toBe(
      "Loads posts when you open the tab: one request per source.",
    );
    // Two in a row, in the width of the panel.
    expect(moreLikeThisFeature.css).toMatch(/\.rdw-mlt-grid \{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  });
});
