/**
 * Document-level CSS for grid fav buttons, artist Follow, updates bar.
 * Owned with cards / preview chrome (not panel Shadow DOM).
 */
import { CSS_CLASS } from "../config/constants";

export const CARD_CSS = `
.${CSS_CLASS.cardFav} {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  box-sizing: border-box;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0;
}

@supports (anchor-name: --a) {
  .${CSS_CLASS.cardFav} {
    position-anchor: --rdw-img;
    top: calc(anchor(top) + 4px);
    right: calc(anchor(right) + 4px);
  }
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 1;
}

.${CSS_CLASS.cardFav}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError} {
  background: #f8d7da;
  border-color: #a12828;
  color: #a12828;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}:disabled {
  cursor: wait;
}

.${CSS_CLASS.thumb}:has(> a[style*="display: none"]) .${CSS_CLASS.cardFav},
.${CSS_CLASS.thumb}:has(> a[style*="display:none"]) .${CSS_CLASS.cardFav} {
  display: none !important;
}

body.${CSS_CLASS.gridFavsHidden} .${CSS_CLASS.cardFav} {
  display: none !important;
}

.${CSS_CLASS.artistFollow} {
  margin-left: 4px;
  box-sizing: border-box;
  min-height: 18px;
  padding: 0 5px;
  border: 1px solid #666;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  vertical-align: middle;
}

.${CSS_CLASS.artistFollow}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid var(--rdw-border);
  border-radius: 6px;
  background: var(--rdw-surface);
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  color: var(--rdw-text);
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  border: 1px solid var(--rdw-accent);
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.itemName} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: underline;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
`;
