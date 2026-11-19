import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIRST_SHOWN,
  LIMITED_WAIT_S,
  MoreLikeThis,
  fewTagsText,
  firstSource,
  mixedFromText,
  layoutSwitch,
  moreLikeThisFeature,
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
  mixOrder,
  mixPageOffset,
  mixQuery,
  mixSize,
  mixTags,
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
    // No chance in the tests: the first page, and the order the shuffle leaves.
    random: () => 0,
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

  it("offers Similar, then the characters, the copyrights and the favorites, and no artist", () => {
    const sources = relatedSources(postTags());
    expect(sources.map((source) => [source.kind, source.name])).toEqual([
      ["similar", "Similar"],
      ["character", "jessica rabbit"],
      ["copyright", "disney"],
      ["favorites", "In your favorites"],
    ]);
    // The rare tags that say what is in the picture: no tag about the file,
    // none so rare that it is one artist's own, none that is on every post.
    expect(similarTags(postTags())).toEqual(["fairy", "red_dress", "size_difference"]);
    // The posts of the artist of the post are left out of every search.
    expect(relatedQuery(sources[1]?.tags ?? [], sources[1]?.without ?? [])).toBe(
      "jessica_rabbit -esqeazy",
    );
    expect(relatedQuery(sources[2]?.tags ?? [], sources[2]?.without ?? [])).toBe("disney -esqeazy");
  });

  it("leaves out what says nothing: where a picture was sold, a name written twice, words of praise", () => {
    const tag = (name: string, kind: PostTag["kind"], count: number): PostTag => ({
      tag: name,
      kind,
      count,
    });
    const post = [
      tag("katsuragi_shouko", "character", 40),
      tag("shouko_katsuragi", "character", 300),
      tag("original_character", "character", 900000),
      tag("jitaku_keibiin", "copyright", 2000),
      tag("patreon", "copyright", 500000),
      tag("original", "copyright", 900000),
      tag("explicit", "general", 60),
      tag("adult", "general", 80),
      tag("perfect_body", "general", 700),
      tag("single_hair_bun", "general", 30000),
      tag("off_shoulder", "general", 90000),
      tag("office_lady", "general", 50000),
      tag("odd_rare_tag", "general", 25),
    ];
    expect(relatedSources(post).map((source) => source.name)).toEqual([
      "Similar",
      "shouko katsuragi",
      "jitaku keibiin",
      "In your favorites",
    ]);
    // Established tags only, when there are enough of them.
    expect(similarTags(post)).toEqual(["single_hair_bun", "office_lady", "off_shoulder"]);
  });

  it("asks for a mix with one search for any of the tags, from a page taken by chance", () => {
    expect(mixQuery(["fairy", "red_dress", "size_difference"], ["esqeazy"])).toBe(
      "( fairy ~ red_dress ~ size_difference ) -esqeazy",
    );
    expect(mixQuery(["fairy"], [])).toBe("fairy");
    expect(relatedSearchUrl("( a ~ b ) -x", 84)).toBe(
      "https://rule34.xxx/index.php?page=post&s=list&tags=%28+a+%7E+b+%29+-x&pid=84",
    );
    expect(relatedSearchUrl("a")).not.toContain("pid=");
    // A mix has at least as many posts as its most common tag.
    expect(mixSize(postTags(), ["fairy", "red_dress"])).toBe(30000);
    // One of the first twenty pages; the first when there is only one.
    expect(mixPageOffset(30000, () => 0.5)).toBe(10 * 42);
    expect(mixPageOffset(30000, () => 0)).toBe(0);
    expect(mixPageOffset(60, () => 0.99)).toBe(0);
    // The rarest tags the first time, others of the pool after.
    const pool = ["a", "b", "c", "d", "e", "f", "g"];
    expect(mixTags(pool, true, () => 0)).toEqual(["a", "b", "c", "d", "e"]);
    expect(mixTags(pool, false, () => 0)).toHaveLength(5);
    expect(mixTags(pool, false, () => 0)).not.toEqual(["a", "b", "c", "d", "e"]);
  });

  it("shuffles a mix with weight: the posts with two of its tags before those with one", () => {
    const post = (id: number, tags: string[]): RankedPost => ({ ...ranked(id), tags });
    const posts = [
      post(1, ["a"]),
      post(2, ["a", "b"]),
      post(3, ["b"]),
      post(4, ["a", "b", "c"]),
      post(5, ["c", "zzz"]),
    ];
    for (const chance of [0, 0.3, 0.7, 0.999]) {
      const order = mixOrder(posts, ["a", "b", "c"], () => chance).map((entry) => entry.id);
      expect([...order.slice(0, 2)].sort()).toEqual([2, 4]);
      expect([...order.slice(2)].sort()).toEqual([1, 3, 5]);
    }
    expect(mixedFromText(["fairy", "size_difference"])).toBe("Mixed from: fairy, size difference");
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
  it("loads the mix of Similar as soon as it is opened, with nothing to press", async () => {
    const props = await mount();
    expect(props.load).toHaveBeenCalledTimes(1);
    expect(props.load).toHaveBeenCalledWith("( fairy ~ red_dress ~ size_difference ) -esqeazy", 0);
    // Opening is not a choice of a source: nothing is remembered for it.
    expect(props.onPick).not.toHaveBeenCalled();
    // No artist among the sources, no numbers on the tags; the favorites are counted and last.
    expect(tabs().map((tab) => tab.textContent)).toEqual([
      "Similar",
      "jessica rabbit",
      "disney",
      "Favorites 2",
    ]);
    // What the mix is made from is said, and is not to be pressed.
    const line = host.querySelector(".rdw-mlt-mix");
    expect(line?.querySelector("p")?.textContent).toBe(
      "Mixed from: fairy, red dress, size difference",
    );
    expect(line?.querySelectorAll("button")).toHaveLength(1);
    const cells = [...host.querySelectorAll("a.rdw-mlt-cell")];
    expect(cells).toHaveLength(2);
    expect(cells.every((cell) => cell.getAttribute("title")?.endsWith("shared tags"))).toBe(true);
    expect(host.querySelector("a.rdw-mlt-link")?.textContent).toBe("Search these tags \u2192");
    expect(host.querySelector("a.rdw-mlt-link")?.getAttribute("href")).toContain(
      "tags=%28+fairy+%7E+red_dress+%7E+size_difference+%29+-esqeazy",
    );
  });

  it("makes another mix when asked: a new search, in place of the one shown", async () => {
    const props = await mount({ random: () => 0.5 });
    // The mix is by tags of up to 70000 posts: a page by chance, here the tenth.
    expect(props.load).toHaveBeenLastCalledWith(expect.stringContaining(" ~ "), 10 * 42);
    const another = host.querySelector<HTMLButtonElement>(".rdw-mlt-mix button");
    expect(another?.textContent).toBe("\u21bb Another mix");
    await press(another ?? undefined);
    expect(props.load).toHaveBeenCalledTimes(2);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(2);
    // Another source has no such line.
    await press(tabs()[1]);
    expect(host.querySelector(".rdw-mlt-mix")).toBeNull();
  });

  it("asks for the first page when the page taken by chance is empty", async () => {
    const load = vi.fn((_query: string, offset: number) =>
      Promise.resolve(offset === 0 ? [ranked(11)] : []),
    );
    await mount({ load, random: () => 0.5 });
    expect(load.mock.calls.map((call) => call[1])).toEqual([420, 0]);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(1);
  });

  it("keeps the switch to two rows: the rest are behind +N, the picked one always in sight", () => {
    const sources = relatedSources(postTags()).filter((source) => source.kind !== "favorites").slice(0, 2);
    const five = [
      ...sources,
      { ...sources[1]!, key: "character:b", name: "b" },
      { ...sources[1]!, key: "character:c", name: "c" },
      { ...sources[1]!, key: "character:d", name: "d" },
    ];
    // One row when all fit; else two rows shared evenly, three and two of five.
    expect(layoutSwitch([50, 50, 50], 60, 70, 300, 2)).toEqual({ shown: 3, rowOne: 4 });
    expect(layoutSwitch([50, 50, 50, 50], 60, 70, 200, 2)).toEqual({ shown: 4, rowOne: 3 });
    expect(layoutSwitch([90, 90, 90], 60, null, 200, 2)).toEqual({ shown: 3, rowOne: 2 });
    // Only what does not fit two rows goes behind "N more".
    expect(layoutSwitch([90, 90, 90, 90, 90], 60, 70, 200, 2)).toEqual({ shown: 2, rowOne: 2 });
    // Not laid out yet: all of them, in one row.
    expect(layoutSwitch([0, 0], 0, 0, 0, 2)).toEqual({ shown: 2, rowOne: 3 });
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
    // Every row is as wide as the frame: the buttons grow to fill it.
    expect(moreLikeThisFeature.css).toMatch(/\.rdw-mlt-sources \.rdw-seg__btn \{[^}]*flex: 1 1 auto;/);
    expect(moreLikeThisFeature.css).toContain('[data-row-one="3"] .rdw-mlt-sources .rdw-seg__btn:nth-child(-n+3)');
  });

  it("opens on the kind of source picked last, where the post has one", async () => {
    const sources = relatedSources(postTags());
    expect(firstSource(sources, null)?.kind).toBe("similar");
    expect(firstSource(sources, "character")?.name).toBe("jessica rabbit");
    const props = await mount({ lastKind: "character" });
    expect(props.load).toHaveBeenCalledWith("jessica_rabbit -esqeazy", 0);
    render(null, host);
    // Never on the favorites: whether there are any is not known when the tab opens.
    expect(firstSource(sources, "favorites")?.kind).toBe("similar");
    const again = await mount({ lastKind: "favorites" });
    expect(again.load).toHaveBeenCalledTimes(1);
    // Picked, they need no request.
    await press(tabs()[3]);
    expect(again.load).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll("a.rdw-mlt-cell")).toHaveLength(2);
  });

  it("loads another source when it is picked, once, and keeps both", async () => {
    const props = await mount();
    await press(tabs()[1]);
    expect(props.load).toHaveBeenCalledTimes(2);
    expect(props.load).toHaveBeenLastCalledWith("jessica_rabbit -esqeazy", 0);
    expect(props.onPick).toHaveBeenLastCalledWith("character");
    await press(tabs()[2]);
    expect(props.load).toHaveBeenLastCalledWith("disney -esqeazy", 0);
    expect(props.onPick).toHaveBeenLastCalledWith("copyright");
    await press(tabs()[3]);
    await press(tabs()[0]);
    await press(tabs()[1]);
    expect(props.load).toHaveBeenCalledTimes(3);
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
      .fn<(query: string, offset: number) => Promise<RankedPost[]>>()
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

  it("has no Favorites where none of them is like the post, and is honest about a post with few tags", async () => {
    await mount({ readFavorites: () => Promise.resolve([]) });
    expect(tabs().map((tab) => tab.textContent)).toEqual(["Similar", "jessica rabbit", "disney"]);
    // Nine tags on the post: the list is shown, with a line that says it is weak.
    expect(host.textContent).toContain("Few shared tags \u2014 this post has only 9 tags.");
    expect(fewTagsText(1)).toBe("Few shared tags \u2014 this post has only 1 tag.");
    expect(sharedTagsText(1)).toBe("1 shared tag");
  });

  it("is a setting of the post page that is on unless turned off", () => {
    expect(moreLikeThisFeature.pages).toEqual(["post"]);
    expect(moreLikeThisFeature.defaultEnabled).toBe(true);
    expect(moreLikeThisFeature.label).toBe("Related posts tab");
    expect(moreLikeThisFeature.settingsCaption).toBe(
      "Loads posts when you open the tab: one request per source.",
    );
    // Two in a row, in the width of the panel.
    expect(moreLikeThisFeature.css).toMatch(/\.rdw-mlt-grid \{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  });
});
