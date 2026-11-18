import { skinIsOn } from "../skin/skin-on";

/** The site's message to the user: `body > div#notice.notice` (docs/site.md). */
const NOTICE_SELECTOR = "body > div#notice";
/** On the message once its time is out or it is clicked; the skin hides it. */
export const NOTICE_GONE_CLASS = "rdw-notice-gone";
/** How long a message stays (Kaze, 18.11.2026: six seconds were too long). */
export const NOTICE_SHOWN_MS = 2500;

function findNotice(): HTMLElement | null {
  const notice = document.querySelector(NOTICE_SELECTOR);
  return notice instanceof HTMLElement ? notice : null;
}

/**
 * The message goes after a time and on a click. A new text from the site, or
 * the site showing the element again, brings it back and starts the time over.
 * Only the script's class is set: the text and the style are the site's.
 */
function watchNotice(notice: HTMLElement): void {
  let timer: number | undefined;
  const hide = (): void => {
    window.clearTimeout(timer);
    notice.classList.add(NOTICE_GONE_CLASS);
  };
  const show = (): void => {
    window.clearTimeout(timer);
    notice.classList.remove(NOTICE_GONE_CLASS);
    if (notice.textContent.trim() !== "") {
      timer = window.setTimeout(hide, NOTICE_SHOWN_MS);
    }
  };
  notice.addEventListener("click", hide);
  new MutationObserver(show).observe(notice, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });
  show();
}

/**
 * In the script's themes the message is a plate over the page (the skin), and
 * a plate that stays until the page is loaded again is in the way. In the
 * site's themes it is the site's bar in the flow and is left as it is.
 * Whether the element is in the page before there is a message is not known:
 * when it is not, the children of the body are watched for it.
 */
export function mountSiteNotice(): void {
  if (!skinIsOn()) {
    return;
  }
  const notice = findNotice();
  if (notice !== null) {
    watchNotice(notice);
    return;
  }
  const waiting = new MutationObserver(() => {
    const added = findNotice();
    if (added !== null) {
      waiting.disconnect();
      watchNotice(added);
    }
  });
  waiting.observe(document.body, { childList: true });
}
