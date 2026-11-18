import { render } from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { IconHelp, IconX, Popover } from "../ui/kit";
import { SearchHelpList, type SearchHelp } from "../ui/kit/search-field";
import { skinIsOn } from "../skin/skin-on";

/**
 * The site's own search field on Posts and Feed, dressed like the script's
 * search fields: a magnifier, a button that clears it, and a "?" that lists
 * what the site's search understands.
 *
 * Nothing of the site's is moved. The field sits in `div.awesomplete`, which
 * the site already positions for its suggestion list; the two buttons are
 * added to that box and laid over the right end of the field.
 */

export const SITE_SEARCH_BOX_SELECTOR = "div.awesomplete";
export const SITE_SEARCH_TOOLS_CLASS = "rdw-site-search-tools";
export const SITE_SEARCH_TOOL_CLASS = "rdw-site-search-tool";
export const SITE_SEARCH_BOX_CLASS = "rdw-site-search-box";

const CLEAR_LABEL = "Clear search";
const HELP_LABEL = "Search syntax";
const HELP_WIDTH_PX = 380;
const ICON_PX = 14;

/**
 * The site's cheat sheet, less what the panel under the field already does
 * with a control: the order, the least score, pictures or videos, AI posts.
 */
export const SITE_SEARCH_HELP: SearchHelp = {
  label: HELP_LABEL,
  widthPx: HELP_WIDTH_PX,
  rows: [
    ["cat dog", "posts with both tags"],
    ["( cat ~ dog )", "posts with either tag; keep the spaces"],
    ["-cat", "posts without the tag"],
    ["ca*t", "any tag that starts with ca and ends with t"],
    ["night~", "tags spelled like night"],
    ["user:bob", "posts uploaded by bob"],
    ["rating:safe", "by rating; -rating:safe for the rest"],
    ["parent:1234", "post 1234 and its child posts"],
    ["width:>=1000", "by size; height: works the same"],
    ["aspectratio:16:9", "by shape, within 3%"],
    ["sourcedomains:x.com", "by the site of the source"],
    ["md5:abc*", "by the file's hash"],
  ],
  note: "Sort, Min score, Media and AI posts are set with the controls below the field.",
};

function SiteSearchTools(props: { readonly input: HTMLInputElement }): JSX.Element {
  const { input } = props;
  const [filled, setFilled] = useState(input.value.length > 0);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sync = (): void => {
      setFilled(input.value.length > 0);
    };
    // The panel under the field writes into it too, without an event of its own.
    const timer = window.setInterval(sync, 400);
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    return () => {
      window.clearInterval(timer);
      input.removeEventListener("input", sync);
      input.removeEventListener("change", sync);
    };
  }, [input]);

  return (
    <>
      {filled ? (
        <button
          type="button"
          className={`${SITE_SEARCH_TOOL_CLASS} rdw-kit-focusable`}
          aria-label={CLEAR_LABEL}
          title={CLEAR_LABEL}
          onClick={() => {
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            setFilled(false);
            input.focus();
          }}
        >
          <IconX size={ICON_PX} />
        </button>
      ) : null}
      <button
        type="button"
        ref={helpRef}
        className={`${SITE_SEARCH_TOOL_CLASS} rdw-kit-focusable`}
        aria-label={HELP_LABEL}
        title={HELP_LABEL}
        aria-expanded={helpOpen}
        onClick={() => {
          setHelpOpen(!helpOpen);
        }}
      >
        <IconHelp size={ICON_PX} />
      </button>
      <Popover
        open={helpOpen}
        onClose={() => {
          setHelpOpen(false);
        }}
        anchorRef={helpRef}
        widthPx={HELP_WIDTH_PX}
        aria-label={HELP_LABEL}
      >
        <SearchHelpList help={SITE_SEARCH_HELP} />
      </Popover>
    </>
  );
}

/** Adds the buttons to the box of the site's search field. Safe to call again. */
export function mountSiteSearchTools(input: HTMLInputElement): void {
  // Without the skin the field is left the way the site draws it.
  if (!skinIsOn()) {
    return;
  }
  const box = input.closest(SITE_SEARCH_BOX_SELECTOR);
  if (!(box instanceof HTMLElement) || box.querySelector(`.${SITE_SEARCH_TOOLS_CLASS}`) !== null) {
    return;
  }
  box.classList.add(SITE_SEARCH_BOX_CLASS);
  const tools = document.createElement("span");
  tools.className = SITE_SEARCH_TOOLS_CLASS;
  box.append(tools);
  render(<SiteSearchTools input={input} />, tools);
}
