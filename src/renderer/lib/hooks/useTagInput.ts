import { useCallback, useState } from "react";

export function getLastTagForAutocomplete(draft: string): string {
  const trimmed = draft.replace(/\n/g, " ");
  if (trimmed.length === 0) {
    return "";
  }
  const lastSpace = trimmed.lastIndexOf(" ");
  const lastComma = trimmed.lastIndexOf(",");
  const lastSeparator = Math.max(lastSpace, lastComma);
  if (lastSeparator === -1) {
    return trimmed.trim();
  }
  return trimmed.slice(lastSeparator + 1).trim();
}

export function unclosedParenCount(d: string): number {
  return (d.match(/\(/g) || []).length - (d.match(/\)/g) || []).length;
}

export interface UseTagInputOptions {
  onCommit: (token: string) => void;
}

const sanitizePartial = (value: string): string => {
  return value.replace(/[^\x20-\x7E\t\n\r]/g, "");
};

/**
 * Draft buffer for a tag (supports Rule34 OR-group parentheses). Exposes a commit()
 * to flush the buffer into a chip. Autocomplete target is the last segment after
 * a separator, or the full buffer while typing an OR group.
 */
export function useTagInput({ onCommit }: UseTagInputOptions) {
  const [draft, setDraftState] = useState("");

  const setDraft = useCallback((value: string) => {
    setDraftState(sanitizePartial(value));
  }, []);

  const commit = useCallback(() => {
    const t = draft.trim();
    if (t.length > 0) {
      onCommit(t);
    }
    setDraftState("");
  }, [draft, onCommit]);

  return {
    draft,
    setDraft,
    commit,
  };
}
