import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FORUM_SEARCH_CLEAR_CLASS,
  FORUM_SEARCH_FORM_CLASS,
  dressForumSearch,
} from "../../src/site/list-pages";
import {
  MIN_TAGS,
  UPLOAD_GUIDE_FOLDED_CLASS,
  UPLOAD_GUIDE_TOGGLE_CLASS,
  UPLOAD_HAS_FILE_CLASS,
  UPLOAD_HINT_CLASS,
  UPLOAD_TAG_COUNT_CLASS,
  UPLOAD_TAG_COUNT_SHORT_CLASS,
  countTags,
  formatFileSize,
  mountUploadPage,
  tagCountText,
} from "../../src/site/upload-page";
import { SITE_SKIN_CSS } from "../../src/skin/site-skin";
import { clearStorageCache } from "../../src/storage/store";

/** The form as the site sends it (from Kaze, 17.11.2026), shortened. */
const FORM = `
<div id="upload-form"><form method="post" action="index.php?page=post&amp;s=add" enctype="multipart/form-data">
<h2>Image Upload</h2><br><table><tbody>
<tr><td><div style="margin-bottom: 2em;"><h3>Upload Guidelines</h3><p>Keep these in mind.</p><ul><li>Rate images appropriately.</li></ul></div></td></tr>
<tr><td><label for="fileUpload">Image File:</label><br><input type="file" name="upload" id="fileUpload" size="35" required="required"></td></tr>
<tr><td><label for="txtSource">Source:</label><br><input type="text" name="source" id="txtSource" value="" size="53"><div id="sourceNotice" style="display: none" class="notice"></div></td></tr>
<tr><td><label for="txtTitle">Title:</label><br><input type="text" name="title" id="txtTitle" value="" size="53"></td></tr>
<tr><td><label for="txtTags">Tags:</label><br><div class="awesomplete"><textarea id="tags" name="tags" cols="60" rows="2"></textarea><ul hidden=""></ul></div>Separate tags with spaces.<br><div id="tagsNotice" style="display: none" class="notice"></div><br></td></tr>
<tr><td>Rating:<br><input type="radio" name="rating" value="e" id="rating_e" checked=""><label for="rating_e">Explicit</label><input type="radio" name="rating" value="q" id="rating_q"><label for="rating_q">Questionable</label></td></tr>
<tr><td>My Tags:<br><div id="my-tags"><a href="index.php?page=account&amp;s=options">Edit</a></div></td></tr>
<tr><td style="width: 300px;"> </td></tr>
<tr><td><b>If your post is not listed right away, it requires moderator approval.</b> <br><input type="submit" name="submit" value="Upload"></td></tr>
</tbody></table></form></div>`;

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

describe("upload: counting and sizes", () => {
  it("counts different tags, however they are spaced or cased", () => {
    expect(countTags("  cat   dog\ncat  Dog bird ")).toBe(3);
    expect(countTags("   ")).toBe(0);
  });

  it("says how many are missing until there are enough", () => {
    expect(tagCountText(0)).toBe(`0 tags · ${String(MIN_TAGS)} more to reach ${String(MIN_TAGS)}`);
    expect(tagCountText(1)).toBe("1 tag · 4 more to reach 5");
    expect(tagCountText(5)).toBe("5 tags");
    expect(tagCountText(12)).toBe("12 tags");
  });

  it("writes a file size a person reads at a glance", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2_500_000)).toBe("2.4 MB");
    expect(formatFileSize(250 * 1024 * 1024)).toBe("250 MB");
  });
});

describe("the upload page", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.innerHTML = FORM;
  });

  it("dresses the form without moving or renaming the site's fields", () => {
    const form = document.querySelector("form");
    const before = [...(form?.querySelectorAll("input, textarea") ?? [])].map((field) => [
      field.getAttribute("name"),
      field.parentElement?.tagName,
    ]);
    mountUploadPage();
    mountUploadPage();
    const after = [...(form?.querySelectorAll("input, textarea") ?? [])].map((field) => [
      field.getAttribute("name"),
      field.parentElement?.tagName,
    ]);
    expect(after).toEqual(before);
    expect(form?.getAttribute("action")).toBe("index.php?page=post&s=add");
    expect(document.querySelectorAll(`.${UPLOAD_HINT_CLASS}`)).toHaveLength(1);
    expect(document.querySelectorAll(`.${UPLOAD_TAG_COUNT_CLASS}`)).toHaveLength(1);
    expect(document.querySelectorAll(`.${UPLOAD_GUIDE_TOGGLE_CLASS}`)).toHaveLength(1);
    expect(document.getElementById("fileUpload")?.closest("td")?.classList.contains(UPLOAD_HAS_FILE_CLASS)).toBe(
      false,
    );
  });

  it("counts the tags as they are typed", () => {
    mountUploadPage();
    const tags = document.getElementById("tags");
    const line = document.querySelector(`.${UPLOAD_TAG_COUNT_CLASS}`);
    expect(line?.textContent).toBe("0 tags · 5 more to reach 5");
    expect(line?.classList.contains(UPLOAD_TAG_COUNT_SHORT_CLASS)).toBe(true);
    if (tags instanceof HTMLTextAreaElement) {
      tags.value = "a b c d e";
      tags.dispatchEvent(new Event("input"));
    }
    expect(line?.textContent).toBe("5 tags");
    expect(line?.classList.contains(UPLOAD_TAG_COUNT_SHORT_CLASS)).toBe(false);
    // The line stands right after the field's box, not inside it.
    expect(line?.previousElementSibling?.classList.contains("awesomplete")).toBe(true);
  });

  it("folds the guidelines and remembers it", () => {
    mountUploadPage();
    const toggle = document.querySelector(`.${UPLOAD_GUIDE_TOGGLE_CLASS}`);
    const cell = toggle?.parentElement;
    expect(cell?.classList.contains(UPLOAD_GUIDE_FOLDED_CLASS)).toBe(false);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    if (toggle instanceof HTMLButtonElement) {
      toggle.click();
    }
    expect(cell?.classList.contains(UPLOAD_GUIDE_FOLDED_CLASS)).toBe(true);
    expect(toggle?.textContent).toBe("Show the upload guidelines");

    document.body.innerHTML = FORM;
    mountUploadPage();
    expect(
      document.querySelector(`.${UPLOAD_GUIDE_TOGGLE_CLASS}`)?.parentElement?.classList.contains(
        UPLOAD_GUIDE_FOLDED_CLASS,
      ),
    ).toBe(true);
  });

  it("leaves another form in the same box alone", () => {
    document.body.innerHTML = `<div id="upload-form"><form><table><tbody><tr><td><input type="file" id="videoUpload"></td></tr></tbody></table></form></div>`;
    mountUploadPage();
    expect(document.querySelector(`.${UPLOAD_HINT_CLASS}`)).toBeNull();
  });

  it("is laid out by the skin only when the form has the image fields", () => {
    expect(SITE_SKIN_CSS).toContain("div#upload-form:has(#fileUpload):has(#tags) > form > table > tbody {");
  });
});

describe("the forum search", () => {
  it("gets a clear button after the field, shown only when there is something to clear", () => {
    document.body.innerHTML = `<div id="forum"><div id="search"><form method="post" action="?page=forum&amp;s=search"><input type="text" name="search" value="" style="width: 40%;"><input type="submit" name="submit" value="Search"></form></div></div>`;
    const forum = document.getElementById("forum");
    if (forum === null) {
      throw new Error("no forum");
    }
    dressForumSearch(forum);
    dressForumSearch(forum);
    const form = forum.querySelector("form");
    const input = forum.querySelector('input[name="search"]');
    const clear = forum.querySelector(`.${FORUM_SEARCH_CLEAR_CLASS}`);
    expect(form?.classList.contains(FORUM_SEARCH_FORM_CLASS)).toBe(true);
    expect(forum.querySelectorAll(`.${FORUM_SEARCH_CLEAR_CLASS}`)).toHaveLength(1);
    expect([...(form?.children ?? [])].map((child) => child.tagName)).toEqual(["INPUT", "BUTTON", "INPUT"]);
    expect(clear?.hasAttribute("hidden")).toBe(true);
    if (input instanceof HTMLInputElement && clear instanceof HTMLButtonElement) {
      input.value = "bugs";
      input.dispatchEvent(new Event("input"));
      expect(clear.hidden).toBe(false);
      clear.click();
      expect(input.value).toBe("");
      expect(clear.hidden).toBe(true);
      // A button of its own: it does not send the form.
      expect(clear.type).toBe("button");
    }
  });
});
