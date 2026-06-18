/**
 * Radix Dialog/Sheet can leave scroll-lock or pointer-events styles on <body>
 * when a modal unmounts outside the controlled close path. Call after closing
 * any fullscreen modal (viewer, playlists, etc.).
 */
export function releaseRadixModalLock(): void {
  const { body } = document;
  body.style.removeProperty("pointer-events");
  body.style.removeProperty("overflow");
  body.style.removeProperty("padding-right");
  body.style.removeProperty("margin-right");
  body.removeAttribute("data-scroll-locked");

  const root = document.getElementById("root");
  if (root) {
    root.removeAttribute("inert");
    root.removeAttribute("aria-hidden");
    root.style.removeProperty("pointer-events");
  }

  document.querySelectorAll("[inert]").forEach((node) => {
    node.removeAttribute("inert");
  });

  document.querySelectorAll("nav[aria-hidden='true'], aside[aria-hidden='true']").forEach((node) => {
    node.removeAttribute("aria-hidden");
  });

  document
    .querySelectorAll("[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]")
    .forEach((node) => {
      const state = node.getAttribute("data-state");
      if (state === "closed" || state === null) {
        node.parentElement?.remove();
      }
    });
}
