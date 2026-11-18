import { skinIsOn } from "../skin/skin-on";
import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * The site's Upload page, helped a little. The form and its fields stay the
 * site's, and so does sending it: nothing here touches what is uploaded.
 *
 * - The file field becomes a zone that says which file is chosen and shows a
 *   picture of it. The site's own field lies over the whole zone, so a click
 *   anywhere opens the file dialog and a file can be dropped on it.
 * - Under the tags a line says how many are missing, while there are fewer
 *   than the five the site asks for. A tag entered twice is taken out: this
 *   is the one place where the script changes what is sent, and only by
 *   dropping repeats.
 * - The long guidelines can be folded; the choice is remembered.
 *
 * The page is recognised by its markup. The layout is in the skin.
 */

const FORM_SELECTOR = "div#upload-form";
const FILE_INPUT_ID = "fileUpload";
const TAGS_ID = "tags";

export const UPLOAD_DRAG_CLASS = "rdw-upload-drag";
export const UPLOAD_HAS_FILE_CLASS = "rdw-upload-has-file";
export const UPLOAD_FILE_NAME_CLASS = "rdw-upload-file-name";
export const UPLOAD_PREVIEW_CLASS = "rdw-upload-preview";
export const UPLOAD_HINT_CLASS = "rdw-upload-hint";
export const UPLOAD_REMOVE_CLASS = "rdw-upload-remove";
export const UPLOAD_PREVIEW_BOX_CLASS = "rdw-upload-preview-box";
export const UPLOAD_TAG_COUNT_CLASS = "rdw-upload-tag-count";
export const UPLOAD_TAG_COUNT_SHORT_CLASS = "rdw-upload-tag-count--short";
export const UPLOAD_GUIDE_TOGGLE_CLASS = "rdw-upload-guide-toggle";
export const UPLOAD_GUIDE_FOLDED_CLASS = "rdw-upload-guide-folded";
export const UPLOAD_GUIDE_STATE_ID = "upload-guide-folded";

/** The site's own rule: "at least 5 tags". */
export const MIN_TAGS = 5;
const HINT_TEXT = "Drop a file here or click to choose one";
const REMOVE_LABEL = "Remove file";
const SHOW_GUIDE_LABEL = "Show the upload guidelines";
const HIDE_GUIDE_LABEL = "Hide the guidelines";
const BYTES_PER_KB = 1024;
const SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
const IMAGE_TYPE_PREFIX = "image/";
const TAG_SPLIT = /\s+/;

/** "2.4 MB": a file size a person reads at a glance. */
export function formatFileSize(bytes: number): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= BYTES_PER_KB && unit < SIZE_UNITS.length - 1) {
    value /= BYTES_PER_KB;
    unit += 1;
  }
  const text = unit === 0 || value >= 100 ? String(Math.round(value)) : value.toFixed(1);
  return `${text} ${SIZE_UNITS[unit] ?? "B"}`;
}

/** How many different tags the text holds. */
export function countTags(text: string): number {
  return new Set(
    text
      .toLowerCase()
      .split(TAG_SPLIT)
      .filter((tag) => tag.length > 0),
  ).size;
}

/**
 * The tags with every repeat taken out: the first of each stays, in the order
 * typed, one space between them. Case does not make a tag another tag. A
 * space at the end is kept, so that typing can go on after it.
 */
export function dedupeTags(text: string): string {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const tag of text.split(TAG_SPLIT)) {
    const key = tag.toLowerCase();
    if (tag.length > 0 && !seen.has(key)) {
      seen.add(key);
      kept.push(tag);
    }
  }
  const joined = kept.join(" ");
  return kept.length > 0 && /\s$/.test(text) ? `${joined} ` : joined;
}

/**
 * "0 of 5 tags", "3 of 5 tags"; nothing once there are enough: the line is a
 * reminder, not a counter.
 */
export function tagCountText(count: number): string {
  if (count >= MIN_TAGS) {
    return "";
  }
  return `${String(count)} of ${String(MIN_TAGS)} tags`;
}

function mountFileZone(input: HTMLInputElement): void {
  const zone = input.closest("td");
  if (zone === null || zone.querySelector(`.${UPLOAD_HINT_CLASS}`) !== null) {
    return;
  }
  const hint = document.createElement("span");
  hint.className = UPLOAD_HINT_CLASS;
  hint.textContent = HINT_TEXT;
  const name = document.createElement("span");
  name.className = UPLOAD_FILE_NAME_CLASS;
  name.setAttribute("role", "status");
  const preview = document.createElement("img");
  preview.className = UPLOAD_PREVIEW_CLASS;
  preview.alt = "";
  preview.hidden = true;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = UPLOAD_REMOVE_CLASS;
  // A cross in the corner of the picture; its name is for the tooltip and for screen readers.
  remove.setAttribute("aria-label", REMOVE_LABEL);
  remove.title = REMOVE_LABEL;
  remove.hidden = true;
  remove.addEventListener("click", () => {
    // The site's field is emptied the way a user would empty it, and told so.
    input.value = "";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // The picture and its cross share a box, so that the cross sits in the
  // picture's corner whatever size the picture is.
  const box = document.createElement("span");
  box.className = UPLOAD_PREVIEW_BOX_CLASS;
  box.append(preview, remove);
  zone.append(box, hint, name);

  let previewUrl: string | null = null;
  const show = (): void => {
    const file = input.files?.[0];
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    zone.classList.toggle(UPLOAD_HAS_FILE_CLASS, file !== undefined);
    remove.hidden = file === undefined;
    name.textContent = file === undefined ? "" : `${file.name} · ${formatFileSize(file.size)}`;
    if (file !== undefined && file.type.startsWith(IMAGE_TYPE_PREFIX)) {
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
  };
  input.addEventListener("change", show);
  for (const type of ["dragenter", "dragover"] as const) {
    input.addEventListener(type, () => {
      zone.classList.add(UPLOAD_DRAG_CLASS);
    });
  }
  for (const type of ["dragleave", "drop"] as const) {
    input.addEventListener(type, () => {
      zone.classList.remove(UPLOAD_DRAG_CLASS);
    });
  }
  show();
}

function mountTagCount(tags: HTMLTextAreaElement): void {
  const cell = tags.closest("td");
  if (cell === null || cell.querySelector(`.${UPLOAD_TAG_COUNT_CLASS}`) !== null) {
    return;
  }
  const line = document.createElement("div");
  line.className = UPLOAD_TAG_COUNT_CLASS;
  line.setAttribute("role", "status");
  // After the box of the field, which also holds the site's suggestion list.
  (tags.parentElement?.parentElement === cell ? tags.parentElement : tags).after(line);
  // Too few tags is said in red only once the field was left or the form was
  // sent: on an untouched form it was an error shown before anything was done.
  let touched = false;
  const sync = (): void => {
    const count = countTags(tags.value);
    line.textContent = tagCountText(count);
    line.hidden = count >= MIN_TAGS;
    line.classList.toggle(UPLOAD_TAG_COUNT_SHORT_CLASS, touched && count < MIN_TAGS);
  };
  const touch = (): void => {
    touched = true;
    sync();
  };
  tags.addEventListener("blur", touch);
  cell.closest("form")?.addEventListener("submit", touch, true);
  // A tag entered twice is taken out when the field is left, when a suggestion
  // is picked and when the form is sent; not while typing, which would move
  // the caret under the user's hands.
  const dedupe = (): void => {
    const clean = dedupeTags(tags.value);
    if (clean !== tags.value) {
      tags.value = clean;
    }
  };
  for (const type of ["change", "blur", "awesomplete-selectcomplete"]) {
    tags.addEventListener(type, dedupe);
  }
  cell.closest("form")?.addEventListener("submit", dedupe, true);
  // The site's suggestions and "My Tags" write into the field without typing.
  for (const type of ["input", "change", "keyup", "blur", "awesomplete-selectcomplete"]) {
    tags.addEventListener(type, sync);
  }
  cell.closest("form")?.addEventListener("click", () => {
    window.setTimeout(sync, 0);
  });
  sync();
}

function mountGuideToggle(form: Element): void {
  const guide = form.querySelector("td > div:has(> h3)");
  const cell = guide?.parentElement ?? null;
  if (guide === null || guide === undefined || cell === null) {
    return;
  }
  if (cell.querySelector(`.${UPLOAD_GUIDE_TOGGLE_CLASS}`) !== null) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = UPLOAD_GUIDE_TOGGLE_CLASS;
  const apply = (folded: boolean): void => {
    cell.classList.toggle(UPLOAD_GUIDE_FOLDED_CLASS, folded);
    button.textContent = folded ? SHOW_GUIDE_LABEL : HIDE_GUIDE_LABEL;
    button.setAttribute("aria-expanded", folded ? "false" : "true");
  };
  button.addEventListener("click", () => {
    const folded = !cell.classList.contains(UPLOAD_GUIDE_FOLDED_CLASS);
    setFeatureState(UPLOAD_GUIDE_STATE_ID, folded);
    apply(folded);
  });
  cell.prepend(button);
  apply(getFeatureState(UPLOAD_GUIDE_STATE_ID) === true);
}

/** Does nothing on a page that is not the image upload form. */
export function mountUploadPage(): void {
  const form = document.querySelector(FORM_SELECTOR);
  const input = document.getElementById(FILE_INPUT_ID);
  const tags = document.getElementById(TAGS_ID);
  if (form === null || !(input instanceof HTMLInputElement) || !form.contains(input)) {
    return;
  }
  // The file zone and the fold of the guidelines are drawn by the skin;
  // without it the form stays the site's. Tags are counted and repeats
  // dropped in every theme.
  if (skinIsOn()) {
    mountFileZone(input);
    mountGuideToggle(form);
  }
  if (tags instanceof HTMLTextAreaElement && form.contains(tags)) {
    mountTagCount(tags);
  }
}
