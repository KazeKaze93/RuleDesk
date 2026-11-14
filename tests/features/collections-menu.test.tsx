import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLASS_COLLECTIONS_BTN,
  CollectionsMenu,
} from "../../src/features/post-panel/collections-menu";
import { IMAGE_ID } from "../../src/features/post-panel/site-reads";
import { VIDEO_ELEMENT_ID } from "../../src/features/video-player";
import { THUMB_IMAGE_HOST, VIDEO_CDN_ORIGIN } from "../../src/site/thumb";
import { clearFavsCache } from "../../src/storage/favs";
import {
  addPostToCollection,
  clearStorageCache,
  createPlaylist,
  listPlaylists,
  removePostFromPlaylist,
} from "../../src/storage/store";
import { cleanupKit, fireClick, renderKit } from "../kit/render";

const POST_ID = 111;
const MEDIA_DIR = "2539";
const IMAGE_HASH = "abcd1234ef";
const VIDEO_HASH = "ef987654ab";
const KNOWN_THUMB =
  `https://${THUMB_IMAGE_HOST}/thumbnails/${MEDIA_DIR}/thumbnail_known.jpg?${String(POST_ID)}`;
const TEXT_CREATE = "Create";
const LABEL_NEW_NAME = "New collection name";
const NEW_COLLECTION_NAME = "Later";
const MEMBER_ROLE = "menuitemcheckbox";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function sampleUrl(hash: string): string {
  return `https://${THUMB_IMAGE_HOST}//samples/${MEDIA_DIR}/sample_${hash}.jpg?${String(POST_ID)}`;
}

function videoUrl(hash: string): string {
  return `${VIDEO_CDN_ORIGIN}//images/${MEDIA_DIR}/${hash}.mp4?${String(POST_ID)}`;
}

function expectedThumb(hash: string): string {
  return `https://${THUMB_IMAGE_HOST}/thumbnails/${MEDIA_DIR}/thumbnail_${hash}.jpg?${String(POST_ID)}`;
}

function mountImage(src: string, parent: ParentNode = document.body): HTMLImageElement {
  const image = document.createElement("img");
  image.id = IMAGE_ID;
  image.setAttribute("src", src);
  parent.append(image);
  return image;
}

function mountVideo(src: string, parent: ParentNode = document.body): HTMLVideoElement {
  const video = document.createElement("video");
  video.id = VIDEO_ELEMENT_ID;
  const source = document.createElement("source");
  source.setAttribute("src", src);
  video.append(source);
  parent.append(video);
  return video;
}

function buttonByText(text: string): HTMLButtonElement {
  for (const node of document.querySelectorAll("button")) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent?.includes(text) === true) {
      return node;
    }
  }
  throw new Error(`missing button ${text}`);
}

function setField(input: HTMLInputElement, value: string): void {
  act(() => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("CollectionsMenu thumbs", () => {
  let host: HTMLElement | null = null;

  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
  });

  afterEach(() => {
    if (host !== null) {
      cleanupKit(host);
      host = null;
    }
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mount(): void {
    host = renderKit(<CollectionsMenu postId={POST_ID} />);
  }

  function openMenu(): void {
    const trigger = document.querySelector(`button.${CLASS_COLLECTIONS_BTN}`);
    if (!(trigger instanceof HTMLButtonElement)) {
      throw new Error("collections trigger missing");
    }
    fireClick(trigger);
  }

  function membershipButton(): HTMLButtonElement {
    const button = document.querySelector(`button[role="${MEMBER_ROLE}"]`);
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("collection item missing");
    }
    return button;
  }

  function clickMembership(): void {
    fireClick(membershipButton());
  }

  it("derives a thumb from img#image when adding", () => {
    const playlist = createPlaylist(NEW_COLLECTION_NAME);
    mountImage(sampleUrl(IMAGE_HASH));
    mountVideo(videoUrl(VIDEO_HASH));
    mount();
    openMenu();
    clickMembership();

    expect(listPlaylists()[0]?.id).toBe(playlist.id);
    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({
      [String(POST_ID)]: expectedThumb(IMAGE_HASH),
    });
  });

  it("derives a thumb from the video source when the post has no image", () => {
    createPlaylist(NEW_COLLECTION_NAME);
    mountVideo(videoUrl(VIDEO_HASH));
    mount();
    openMenu();
    clickMembership();

    expect(listPlaylists()[0]?.thumbs).toEqual({
      [String(POST_ID)]: expectedThumb(VIDEO_HASH),
    });
  });

  it("ignores media inside a#p{id} and still adds the post", () => {
    createPlaylist(NEW_COLLECTION_NAME);
    const anchor = document.createElement("a");
    anchor.id = `p${String(POST_ID)}`;
    mountImage(sampleUrl(IMAGE_HASH), anchor);
    mountVideo(videoUrl(VIDEO_HASH), anchor);
    document.body.append(anchor);
    mount();
    openMenu();
    clickMembership();

    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({});
  });

  it("adds the post when the media URL does not yield a thumb", () => {
    createPlaylist(NEW_COLLECTION_NAME);
    mountImage("not-a-url");
    mount();
    openMenu();
    clickMembership();

    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({});
  });

  it("keeps a known thumb when adding again with no media", () => {
    const playlist = createPlaylist(NEW_COLLECTION_NAME);
    addPostToCollection(playlist.id, POST_ID, KNOWN_THUMB);
    removePostFromPlaylist(playlist.id, POST_ID);
    mount();
    openMenu();
    clickMembership();

    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({
      [String(POST_ID)]: KNOWN_THUMB,
    });
  });

  it("fills an empty thumb when a later add can see img#image", () => {
    createPlaylist(NEW_COLLECTION_NAME);
    mount();
    openMenu();
    clickMembership();
    expect(listPlaylists()[0]?.thumbs).toEqual({});

    clickMembership();
    mountImage(sampleUrl(IMAGE_HASH));
    clickMembership();

    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({
      [String(POST_ID)]: expectedThumb(IMAGE_HASH),
    });
  });

  it("stores the derived thumb when creating a collection", () => {
    mountImage(sampleUrl(IMAGE_HASH));
    mount();
    openMenu();
    const input = document.querySelector(`input[aria-label="${LABEL_NEW_NAME}"]`);
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("new collection input missing");
    }
    setField(input, `  ${NEW_COLLECTION_NAME}  `);
    fireClick(buttonByText(TEXT_CREATE));

    expect(listPlaylists()[0]?.name).toBe(NEW_COLLECTION_NAME);
    expect(listPlaylists()[0]?.postIds).toEqual([POST_ID]);
    expect(listPlaylists()[0]?.thumbs).toEqual({
      [String(POST_ID)]: expectedThumb(IMAGE_HASH),
    });
  });
});
