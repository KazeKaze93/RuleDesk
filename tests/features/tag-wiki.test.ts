import { describe, expect, it } from "vitest";

import { findWikiEntryHref, readWikiEntry, sidebarRowTag } from "../../src/features/tag-wiki";

/** The markup Kaze sent from the site on 16.11.2026, shortened. */
const RESULTS = `
<table class="highlightable" style="width: 100%;"><tbody>
<tr>
  <td><a href="index.php?page=wiki&amp;s=view&amp;id=85481"><img src="css/pillow.png"></a></td>
  <td><a href="index.php?page=wiki&amp;s=view&amp;id=85481">fact_attack_adventures</a><br>
    <span>Last updated by <a href="index.php?page=account&amp;s=profile&amp;id=2177794">random-idiot</a></span></td>
  <td><h3>Version 2</h3></td>
</tr>
<tr>
  <td><a href="index.php?page=wiki&amp;s=view&amp;id=90000"><img src="css/pillow.png"></a></td>
  <td><a href="index.php?page=wiki&amp;s=view&amp;id=90000">fact_attack</a></td>
  <td><h3>Version 1</h3></td>
</tr>
</tbody></table>`;

const ENTRY = `
<div id="content">
  <div class="flexi" style="margin-bottom: 5px;">
    <div style="flex-basis: 50%; padding-right: 20px; text-align: justify;">
      <h2 style="display: inline;">Now Viewing: fact_attack_adventures</h2>
      <br>
      <span><b>Tag type: Copyright</b></span>
      <br><br>
      TikTok account that's supposed to tell facts, hence the name "fact attack adventures". Webseries created by itchyluff on twitter.      <br><br><br><br>
      <b>Other Wiki Information</b>
      <br><br>
      <div class="lighter-background">Last updated: <span>Sat, Sep 26 '26, 10:23</span> by <a href="#">random-idiot</a></div>
      <div class="lighter-background">This entry is not locked and you can edit it as you see fit.</div>
    </div>
    <div style="flex-basis: 50%;"><a href="index.php?page=post&amp;s=view&amp;id="><span class="thumb"><img class="preview"></span></a></div>
  </div>
</div>`;

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("the wiki search results", () => {
  it("finds the entry whose name is the tag, not one that only begins like it", () => {
    const results = parse(RESULTS);
    expect(findWikiEntryHref(results, "fact_attack_adventures")).toBe(
      "index.php?page=wiki&s=view&id=85481",
    );
    expect(findWikiEntryHref(results, "fact_attack")).toBe("index.php?page=wiki&s=view&id=90000");
  });

  it("takes the tag with spaces or in another case", () => {
    expect(findWikiEntryHref(parse(RESULTS), "Fact Attack Adventures")).toBe(
      "index.php?page=wiki&s=view&id=85481",
    );
  });

  it("says so when the wiki has no entry for the tag", () => {
    expect(findWikiEntryHref(parse(RESULTS), "something_else")).toBeNull();
    expect(findWikiEntryHref(parse("<p>nothing</p>"), "cat")).toBeNull();
  });
});

describe("a wiki entry", () => {
  it("reads the name, the tag type and the text, without the site's notes", () => {
    expect(readWikiEntry(parse(ENTRY))).toEqual({
      title: "fact_attack_adventures",
      type: "Copyright",
      text: `TikTok account that's supposed to tell facts, hence the name "fact attack adventures". Webseries created by itchyluff on twitter.`,
    });
  });

  it("keeps the paragraphs of a longer text", () => {
    const longer = ENTRY.replace(
      "Webseries created by itchyluff on twitter.",
      "Webseries created by itchyluff on twitter.<br><br>Second paragraph.<br>Its second line.",
    );
    expect(readWikiEntry(parse(longer))?.text).toBe(
      `TikTok account that's supposed to tell facts, hence the name "fact attack adventures". Webseries created by itchyluff on twitter.\n\nSecond paragraph.\nIts second line.`,
    );
  });

  it("gives an empty text for an entry without one, and nothing for another page", () => {
    const bare = ENTRY.replace(/TikTok account[^<]*/, "");
    expect(readWikiEntry(parse(bare))).toEqual({
      title: "fact_attack_adventures",
      type: "Copyright",
      text: "",
    });
    expect(readWikiEntry(parse("<div id='content'><p>else</p></div>"))).toBeNull();
  });
});

describe("a row of the tag sidebar", () => {
  it("reads its tag from the search link, the last one of the row", () => {
    const list = document.createElement("ul");
    list.innerHTML = `<li class="tag-type-copyright"><a href="index.php?page=wiki&amp;s=list&amp;search=one_piece">?</a>
      <a href="index.php?page=post&amp;s=list&amp;tags=cat+one_piece">+</a>
      <a href="index.php?page=post&amp;s=list&amp;tags=one_piece">one piece</a> <span>165282</span></li>`;
    const row = list.querySelector("li");
    expect(row === null ? null : sidebarRowTag(row)).toBe("one_piece");
  });

  it("gives nothing for a row without a search link", () => {
    const row = document.createElement("li");
    row.innerHTML = "<h6>Copyright</h6>";
    expect(sidebarRowTag(row)).toBeNull();
  });
});
