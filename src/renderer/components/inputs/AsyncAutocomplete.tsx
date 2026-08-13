import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useRemoteTags } from "../../lib/hooks/useRemoteTags";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";
import type { SearchResults } from "@shared/types/providers";
import type { ProviderId } from "../../../shared/constants";

export interface AsyncAutocompleteProps {
  label: string;
  onSelect: (option: SearchResults | null) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  value?: string;
  onBlur?: () => void;
  provider?: ProviderId;
  /** Add Artist: filter to artist tags. Default false for playlists/other. */
  artistOnly?: boolean;
}

/**
 * AsyncAutocomplete component for tag selection
 * 
 * WAI-ARIA Compliant: Implements ARIA combobox pattern with proper roles and attributes:
 * - role="combobox" on input
 * - role="listbox" on dropdown
 * - role="option" on each item
 * - aria-expanded, aria-haspopup, aria-controls, aria-autocomplete
 * - aria-selected for keyboard navigation
 * - aria-activedescendant for screen reader support
 * - Keyboard navigation: ArrowUp/Down, Enter, Escape
 * 
 * Uses the same logic as TagAutocomplete - uses useRemoteTags hook
 * and renders a simple dropdown list without Headless UI Combobox
 */
export function AsyncAutocomplete({
  label,
  onSelect,
  onQueryChange,
  placeholder = "Search for tags...",
  value,
  onBlur,
  provider = "rule34",
  artistOnly = false,
}: AsyncAutocompleteProps) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(value || "");
  const query = isControlled ? value : internalQuery;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the same hook as TagAutocomplete
  const { results, isLoading, error } = useRemoteTags({
    query: query.trim(),
    minQueryLength: 2,
    debounceMs: 300,
    provider,
    artistOnly,
  });

  // Show dropdown while loading/error even before results (Rule34 second-pass latency).
  const shouldShowDropdown =
    isOpen &&
    query.trim().length >= 2 &&
    (isLoading || error !== null || results.length > 0);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;

    if (!isControlled) {
      setInternalQuery(newQuery);
    }

    onQueryChange?.(newQuery);

    // Show dropdown if there's a query
    if (newQuery.trim().length >= 2) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (
      query.trim().length >= 2 &&
      (isLoading || error !== null || results.length > 0)
    ) {
      setIsOpen(true);
    }
  };

  // Handle input blur (close dropdown)
  // CRITICAL: Check relatedTarget to determine if blur was caused by clicking on dropdown
  // This prevents closing dropdown when user clicks on list items
  const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if focus is moving to an element within the container
    // relatedTarget is the element receiving focus (if any)
    const relatedTarget = e.relatedTarget;
    
    // If focus is moving to an element inside the container, don't close dropdown
    if (relatedTarget instanceof Node && containerRef.current?.contains(relatedTarget)) {
      return;
    }
    
    // Focus is moving outside the container - close dropdown
    setIsOpen(false);
    setSelectedIndex(-1);
    onBlur?.();
  };

  // Handle tag selection
  const handleSelectTag = (result: SearchResults, e?: React.MouseEvent) => {
    // Prevent default to avoid triggering blur before selection
    e?.preventDefault();
    
    onSelect(result);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Clear input after selection ONLY if not controlled
    // In controlled mode, the parent component manages the value
    if (!isControlled) {
      setInternalQuery("");
      onQueryChange?.("");
    }
    // In controlled mode, don't clear - let parent component handle value via onSelect
    
    // Focus input after selection (use requestAnimationFrame for better timing)
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          handleSelectTag(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <Label className="block ml-1 mb-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlurInternal}
          onKeyDown={handleKeyDown}
          className="w-full"
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-haspopup="listbox"
          aria-controls="async-autocomplete-listbox"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `async-autocomplete-option-${selectedIndex}` : undefined}
          aria-label={label || placeholder}
        />
      </div>
      
      {shouldShowDropdown && (
        <div
          id="async-autocomplete-listbox"
          className="absolute z-[100] mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
          role="listbox"
        >
          {isLoading ? (
            <div
              className="flex items-center justify-center px-4 py-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="mr-2 w-4 h-4 animate-spin" aria-hidden="true" />
              Loading...
            </div>
          ) : error ? (
            <div
              className="px-4 py-2 text-sm text-destructive"
              role="alert"
              aria-live="assertive"
            >
              <p className="font-medium">Search failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error.message || "Unable to search tags. Please try again."}
              </p>
            </div>
          ) : (
            <ul className="py-1" role="group">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={`async-autocomplete-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={cn(
                    "relative cursor-pointer select-none px-4 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => {
                    setSelectedIndex(index);
                    handleSelectTag(result, e);
                  }}
                >
                  {result.label}
                  {result.type && (
                    <span className="ml-2 text-xs text-muted-foreground" aria-label={`Type: ${result.type}`}>
                      ({result.type})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
