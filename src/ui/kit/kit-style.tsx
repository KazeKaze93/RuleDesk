import { createContext } from "preact";
import type { JSX } from "preact";
import { useContext } from "preact/hooks";

/**
 * True inside a tree whose root has put the styles of the whole kit in once
 * (the pages of the script, pages/host.tsx). Outside such a tree, on the
 * site's own pages and in what is drawn into `document.body`, every component
 * brings its own styles, as it always did.
 *
 * Each button, chip and switch used to carry a `<style>` of its own wherever
 * it stood: some 600 of them on the Following page with 300 artists (the
 * audit of 19.11.2026).
 */
export const KitStylesProvided = createContext(false);

/** The styles of a kit component, unless the tree around it has them already. */
export function KitStyle(props: { readonly css: string }): JSX.Element | null {
  return useContext(KitStylesProvided) ? null : <style>{props.css}</style>;
}
