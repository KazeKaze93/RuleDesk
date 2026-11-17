import { getFeatureState, setFeatureState } from "../storage/store";

/**
 * The site's Upload page, helped a little. The form and its fields stay the
 * site's, and so does sending it: nothing here touches what is uploaded.
 *
 * - The file field becomes a zone that says which file is chosen and shows a
 *   picture of it. The site's own field lies over the whole zone, so a click
 *   anywhere opens the file dialog and a file can be dropped on it.
 * - Under the tags a line counts them: the site asks for at least five.
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
export const UPLOAD_TAG_COUNT_CLASS = "rdw-upload-tag-count";
export const UPLOAD_TAG_COUNT_SHORT_CLASS = "rdw-upload-tag-count--short";
export const UPLOAD_GUIDE_TOGGLE_CLASS = "rdw-upload-guide-toggle";
export const UPLOAD_GUIDE_FOLDED_CLASS = "rdw-upload-guide-folded";
export const UPLOAD_GUIDE_STATE_ID = "upload-guide-folded";

/** The site's own rule: "at least 5 tags". */
export const MIN_TAGS = 5;
const HINT_TEXT = "Drop a file here or click to choose one";
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

/** "3 tags · 2 more to reach 5", "5 tags", "1 tag · 4 more to reach 5". */
export function tagCountText(count: number): string {
  const word = `${String(count)} ${count === 1 ? "tag" : "tags"}`;
  return count >= MIN_TAGS
    ? word
    : `${word} · ${String(MIN_TAGS - count)} more to reach ${String(MIN_TAGS)}`;
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
  zone.append(preview, hint, name);

  let previewUrl: string | null = null;
  const show = (): void => {
    const file = input.files?.[0];
    if (previewUrl !== null) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    zone.classList.toggle(UPLOAD_HAS_FILE_CLASS, file !== undefined);
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
  const sync = (): void => {
    const count = countTags(tags.value);
    line.textContent = tagCountText(count);
    line.classList.toggle(UPLOAD_TAG_COUNT_SHORT_CLASS, count < MIN_TAGS);
  };
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
  mountFileZone(input);
  if (tags instanceof HTMLTextAreaElement && form.contains(tags)) {
    mountTagCount(tags);
  }
  mountGuideToggle(form);
}
