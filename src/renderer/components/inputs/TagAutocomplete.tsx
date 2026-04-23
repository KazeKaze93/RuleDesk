import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../ui/popover";
import {
  Command,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandLoading,
} from "../ui/command";
import { useRemoteTags } from "../../lib/hooks/useRemoteTags";
import {
  getLastTagForAutocomplete,
  unclosedParenCount,
  useTagInput,
} from "../../lib/hooks/useTagInput";
import { TagChip } from "./TagChip";
import { useSearchStore } from "../../store/searchStore";
import { cn } from "../../lib/utils";

function remoteTagQueryForDraft(d: string): string {
  const last = getLastTagForAutocomplete(d);
  if (last.startsWith("-") && !last.trimStart().startsWith("(")) {
    return last.slice(1).trim();
  }
  return last;
}

interface TagAutocompleteProps {
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  onTagSelect?: () => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

/**
 * Chip-based tag search: composes Rule34 query via searchStore, with remote autocomplete for the last token.
 */
export function TagAutocomplete({
  onKeyDown,
  placeholder = "Add tags, Enter to search…",
  className,
  onTagSelect,
  onClear,
  showClearButton = false,
}: TagAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listOpen, setListOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const includeTags = useSearchStore((s) => s.includeTags);
  const excludeTags = useSearchStore((s) => s.excludeTags);
  const addIncludeTag = useSearchStore((s) => s.addIncludeTag);
  const addExcludeTag = useSearchStore((s) => s.addExcludeTag);
  const removeIncludeTag = useSearchStore((s) => s.removeIncludeTag);
  const removeExcludeTag = useSearchStore((s) => s.removeExcludeTag);
  const toggleChipVariant = useSearchStore((s) => s.toggleChipVariant);
  const clearTagChips = useSearchStore((s) => s.clearTagChips);

  const { draft, setDraft, commit } = useTagInput({
    onCommit: (token) => {
      const t = token.trim();
      if (t.length === 0 || t === "-") {
        return;
      }
      if (t.length >= 2 && t.startsWith("(") && t.endsWith(")")) {
        addIncludeTag(t);
        onTagSelect?.();
        return;
      }
      if (t.startsWith("-") && t.length > 1) {
        addExcludeTag(t.slice(1).trim());
        onTagSelect?.();
        return;
      }
      addIncludeTag(t);
      onTagSelect?.();
    },
  });

  const autocompleteQuery = useMemo(
    () => remoteTagQueryForDraft(draft),
    [draft]
  );

  const hasBarContent =
    includeTags.length > 0 || excludeTags.length > 0 || draft.length > 0;

  const { results, isLoading } = useRemoteTags({
    query: autocompleteQuery,
    minQueryLength: 2,
    debounceMs: 300,
    provider: "rule34",
  });

  const showSuggestions =
    listOpen &&
    autocompleteQuery.length >= 2 &&
    (isLoading || results.length > 0);

  const removeLastChip = useCallback(() => {
    if (excludeTags.length > 0) {
      const last = excludeTags[excludeTags.length - 1];
      if (last) {
        removeExcludeTag(last);
      }
      return;
    }
    if (includeTags.length > 0) {
      const last = includeTags[includeTags.length - 1];
      if (last) {
        removeIncludeTag(last);
      }
    }
  }, [excludeTags, includeTags, removeExcludeTag, removeIncludeTag]);

  const handleSelectFromList = useCallback(
    (tagValue: string) => {
      const last = getLastTagForAutocomplete(draft);
      if (last.startsWith("-") && !last.trimStart().startsWith("(")) {
        addExcludeTag(tagValue);
      } else {
        addIncludeTag(tagValue);
      }
      setDraft("");
      setListOpen(false);
      setSelectedIndex(-1);
      onTagSelect?.();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [addExcludeTag, addIncludeTag, draft, onTagSelect, setDraft]
  );

  const handleEditChip = useCallback(
    (tag: string, variant: "include" | "exclude") => {
      if (variant === "exclude") {
        removeExcludeTag(tag);
        setDraft(`-${tag}`);
      } else {
        removeIncludeTag(tag);
        setDraft(tag);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [removeExcludeTag, removeIncludeTag, setDraft]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) =>
          i < results.length - 1 ? i + 1 : i
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : -1));
        return;
      }
      if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) {
          handleSelectFromList(item.value);
        }
        return;
      }
    }

    if (e.key === "Escape" && listOpen) {
      e.preventDefault();
      setListOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === "Backspace" && draft.length === 0) {
      e.preventDefault();
      removeLastChip();
      return;
    }

    if (e.key === "Enter") {
      if (draft.trim().length === 0) {
        e.preventDefault();
        onTagSelect?.();
        onKeyDown?.(e);
        return;
      }
      e.preventDefault();
      commit();
      setListOpen(false);
      return;
    }

    if (e.key === ",") {
      e.preventDefault();
      commit();
      return;
    }

    if (e.key === " ") {
      if (unclosedParenCount(draft) > 0) {
        return;
      }
      if (draft.trim().length > 0) {
        e.preventDefault();
        commit();
      }
      return;
    }

    onKeyDown?.(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    if (unclosedParenCount(e.target.value) > 0) {
      setListOpen(false);
      return;
    }
    if (remoteTagQueryForDraft(e.target.value).length >= 2) {
      setListOpen(true);
      setSelectedIndex(-1);
    } else {
      setListOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (
      remoteTagQueryForDraft(draft).length >= 2 &&
      (results.length > 0 || isLoading)
    ) {
      setListOpen(true);
    }
  };

  const handleInputBlur = () => {
    setListOpen(false);
    setSelectedIndex(-1);
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft("");
    clearTagChips();
    onClear?.();
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!containerRef.current || !ev.target) {
        return;
      }
      if (!containerRef.current.contains(ev.target as globalThis.Node)) {
        setListOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const handleListPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
  };

  return (
    <div ref={containerRef} className={cn("relative flex-1", className)}>
      <Popover
        open={showSuggestions}
        onOpenChange={(o) => {
          if (!o) {
            setListOpen(false);
            setSelectedIndex(-1);
          }
        }}
      >
        <PopoverAnchor asChild>
          <div className="relative w-full min-w-0">
            <Search
              className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div
              className={cn(
                "flex min-h-9 w-full max-w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background py-0.5 pl-8",
                "focus-within:ring-1 focus-within:ring-ring",
                showClearButton && hasBarContent && "pr-7"
              )}
            >
              {includeTags.map((tag) => (
                <TagChip
                  key={`i:${tag}`}
                  tag={tag}
                  variant="include"
                  onRemove={() => {
                    removeIncludeTag(tag);
                  }}
                  onToggleVariant={() => {
                    toggleChipVariant(tag);
                  }}
                  onEdit={() => {
                    handleEditChip(tag, "include");
                  }}
                />
              ))}
              {excludeTags.map((tag) => (
                <TagChip
                  key={`e:${tag}`}
                  tag={tag}
                  variant="exclude"
                  onRemove={() => {
                    removeExcludeTag(tag);
                  }}
                  onToggleVariant={() => {
                    toggleChipVariant(tag);
                  }}
                  onEdit={() => {
                    handleEditChip(tag, "exclude");
                  }}
                />
              ))}
              <Input
                ref={inputRef}
                value={draft}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="min-w-[6rem] flex-1 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 h-7 py-0"
                placeholder={includeTags.length + excludeTags.length > 0 ? "" : placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-haspopup="listbox"
                aria-controls="tag-search-listbox"
                aria-autocomplete="list"
                type="text"
              />
            </div>
            {showClearButton && hasBarContent && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleClearClick}
                className="absolute right-1 top-1.5 h-6 w-6 p-0 shrink-0"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          id="tag-search-listbox"
          className="w-[var(--radix-popover-anchor-width)] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDown={handleListPointerDown}
        >
          <Command shouldFilter={false} className="max-h-64">
            <CommandList>
              {isLoading ? (
                <CommandLoading>
                  <Loader2
                    className="mr-2 h-4 w-4 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  Loading…
                </CommandLoading>
              ) : results.length === 0 ? (
                <CommandEmpty>No tag suggestions</CommandEmpty>
              ) : (
                results.map((result, index) => (
                  <CommandItem
                    key={result.id}
                    value={String(result.id)}
                    onSelect={() => handleSelectFromList(result.value)}
                    className={cn(
                      index === selectedIndex && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="truncate">{result.label}</span>
                    {result.type && (
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        ({result.type})
                      </span>
                    )}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
