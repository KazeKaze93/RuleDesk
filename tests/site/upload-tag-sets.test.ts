import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  TAG_TYPES_MAX,
  rememberTagKinds,
  resetTagTypesCache,
  tagKindOf,
} from "../../src/site/tag-types";
import {
  UPLOAD_SETS_CLASS,
  UPLOAD_SETS_EDIT_CLASS,
  UPLOAD_SET_CLASS,
  UPLOAD_TAG_COUNT_CLASS,
  mountUploadPage,
} from "../../src/site/upload-page";
import {
  addTagsToText,
  readTagSets,
  usableTagSets,
  writeTagSets,
} from "../../src/site/upload-tag-sets";
import { clearStorageCache, setFeatureState } from "../../src/storage/store";
import { chipKindOfTag } from "../../src/ui/tag-chip-kind";

/** The tags row of the form as the site sends it (from Kaze, 17.11.2026). */
const FORM = `
<div id="upload-form"><form method="post" action="index.php?page=post&amp;s=add" enctype="multipart/form-data">
<table><tbody>
<tr><td><input type="file" name="upload" id="fileUpload" required="required"></td></tr>
<tr><td><label for="txtTags">Tags:</label><br><div class="awesomplete"><textarea id="tags" name="tags"></textarea><ul hidden=""></ul></div>Separate tags with spaces.<br></td></tr>
<tr><td><input type="submit" name="submit" value="Upload"></td></tr>
</tbody></table></form></div>`;

const memory = new Map<string, unknown>();

beforeEach(() => {
  memory.clear();
  clearStorageCache();
  resetTagTypesCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
  document.documentElement.className = "";
  document.body.innerHTML = FORM;
  window.location.hash = "";
});

function tagsField(): HTMLTextAreaElement {
  const field = document.getElementById("tags");
  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error("no tags field");
  }
  return field;
}

describe("the sets of tags of the Upload page", () => {
  it("adds the tags of a set after what is typed, and no tag twice", () => {
    expect(addTagsToText("", "one two")).toBe("one two ");
    expect(addTagsToText("solo  ", "one two")).toBe("solo one two ");
    expect(addTagsToText("One solo", "one two")).toBe("One solo two ");
    // Nothing to add: the text is left as it was, to the last space.
    expect(addTagsToText("one two", "TWO one")).toBe("one two");
  });

  it("keeps the sets and gives a button only to one with a name and tags", () => {
    writeTagSets([
      { name: "Mine", tags: "nyx_x ai_generated" },
      { name: "", tags: "orphan" },
      { name: "Empty", tags: "  " },
    ]);
    expect(readTagSets()).toHaveLength(3);
    expect(usableTagSets().map((set) => set.name)).toEqual(["Mine"]);
    // What is not a set is left out when read.
    setFeatureState("upload-tag-sets", [{ name: 1 }, "x", { name: "Ok", tags: "a" }]);
    expect(readTagSets()).toEqual([{ name: "Ok", tags: "a" }]);
  });

  it("puts a button for each set under the count, and a press writes into the field", () => {
    writeTagSets([{ name: "Mine", tags: "nyx_x ai_generated" }]);
    mountUploadPage();
    mountUploadPage();
    const rows = document.querySelectorAll(`.${UPLOAD_SETS_CLASS}`);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.previousElementSibling?.classList.contains(UPLOAD_TAG_COUNT_CLASS)).toBe(true);
    const button = document.querySelector(`.${UPLOAD_SET_CLASS}`);
    expect(button?.textContent).toBe("Mine");
    expect(button?.getAttribute("type")).toBe("button");

    const field = tagsField();
    field.value = "solo nyx_x";
    const heard: string[] = [];
    field.addEventListener("input", () => heard.push("input"));
    field.addEventListener("change", () => heard.push("change"));
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(field.value.trim()).toBe("solo nyx_x ai_generated");
    expect(heard).toEqual(["input", "change"]);
    // The count under the field heard it too: three tags of the five.
    expect(document.querySelector(`.${UPLOAD_TAG_COUNT_CLASS}`)?.textContent).toBe("3 of 5 tags");
    // The field is still the site's, in its place.
    expect(field.getAttribute("name")).toBe("tags");
    expect(field.parentElement?.className).toBe("awesomplete");
  });

  it("leads to the settings where there are no sets yet", () => {
    mountUploadPage();
    expect(document.querySelector(`.${UPLOAD_SET_CLASS}`)).toBeNull();
    const edit = document.querySelector(`.${UPLOAD_SETS_EDIT_CLASS}`);
    expect(edit?.textContent).toBe("Add tag sets");
    edit?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(window.location.hash).toBe("#rdw/settings/upload");
  });
});

describe("what kind a tag is", () => {
  it("remembers the kinds the site named and nothing of a general tag", () => {
    rememberTagKinds([
      ["Some Artist", "artist"],
      ["cat", "general"],
      ["naruto", "copyright"],
      ["unknown", undefined],
    ]);
    expect(tagKindOf("some_artist")).toBe("artist");
    expect(tagKindOf("naruto")).toBe("copyright");
    expect(tagKindOf("cat")).toBeNull();
    // Kept for the next page: read back from the storage.
    resetTagTypesCache();
    clearStorageCache();
    expect(tagKindOf("some artist")).toBe("artist");
  });

  it("drops the oldest past its limit", () => {
    rememberTagKinds(
      Array.from({ length: TAG_TYPES_MAX + 2 }, (_unused, index): [string, string] => [
        `tag_${String(index)}`,
        "character",
      ]),
    );
    expect(tagKindOf("tag_0")).toBeNull();
    expect(tagKindOf("tag_1")).toBeNull();
    expect(tagKindOf(`tag_${String(TAG_TYPES_MAX + 1)}`)).toBe("character");
  });

  it("colours a chip by it, and leaves what is not a tag alone", () => {
    rememberTagKinds([["sakura", "character"]]);
    expect(chipKindOfTag("sakura")).toBe("character");
    expect(chipKindOfTag("never_seen")).toBe("default");
    expect(chipKindOfTag("rating:safe")).toBe("default");
  });
});
