import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { useRemoteTags } from "../../lib/hooks/useRemoteTags";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface TagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

/**
 * TagAutocomplete component for Browse page
 * 
 * Supports multiple tags separated by spaces or commas.
 * Shows autocomplete suggestions for the last tag being typed.
 */
export function TagAutocomplete({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search for tags (e.g., 'blue_hair', 'cyberpunk')",
  className,
}: TagAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract the last tag being typed (for autocomplete)
  const getLastTag = (query: string): string => {
    // Find the last space or comma
    const lastSpace = query.lastIndexOf(" ");
    const lastComma = query.lastIndexOf(",");
    const lastSeparator = Math.max(lastSpace, lastComma);
    
    if (lastSeparator === -1) {
      // No separator found, entire query is the tag
      return query;
    }
    
    // Return everything after the last separator
    return query.slice(lastSeparator + 1).trim();
  };

  const lastTag = getLastTag(value);
  const { results, isLoading } = useRemoteTags({
    query: lastTag,
    minQueryLength: 2,
    debounceMs: 300,
    provider: "rule34",
  });

  // Show dropdown when there are results and query is long enough
  const shouldShowDropdown = isOpen && lastTag.length >= 2 && results.length > 0;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Show dropdown if there's a query
    if (getLastTag(newValue).length >= 2) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (lastTag.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur (close dropdown)
  // Note: onMouseDown on list items fires before onBlur, so clicks work correctly
  const handleBlur = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle tag selection
  // Using onMouseDown instead of onClick ensures it fires before onBlur
  const handleSelectTag = (tagValue: string, e?: React.MouseEvent) => {
    // Prevent input blur when clicking on list item
    e?.preventDefault();
    
    const lastSpace = value.lastIndexOf(" ");
    const lastComma = value.lastIndexOf(",");
    const lastSeparator = Math.max(lastSpace, lastComma);
    
    let newValue: string;
    if (lastSeparator === -1) {
      // No separator, replace entire query
      newValue = tagValue;
    } else {
      // Replace last tag, keep separators and add space after
      newValue = value.slice(0, lastSeparator + 1) + tagValue + " ";
    }
    
    onChange(newValue);
    setIsOpen(false);
    setSelectedIndex(-1);
    // Focus input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) {
      onKeyDown?.(e);
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
          handleSelectTag(results[selectedIndex].value);
        } else {
          onKeyDown?.(e);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        onKeyDown?.(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
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
    <div ref={containerRef} className={cn("relative flex-1", className)}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownInternal}
        className="flex-1"
        autoComplete="off"
        role="combobox"
        aria-expanded={shouldShowDropdown}
        aria-haspopup="listbox"
        aria-controls="tag-autocomplete-listbox"
        aria-autocomplete="list"
      />
      
      {shouldShowDropdown && (
        <div
          id="tag-autocomplete-listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
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
          ) : (
            <ul className="py-1" role="group">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={cn(
                    "relative cursor-pointer select-none px-4 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseDown={(e) => handleSelectTag(result.value, e)}
                  onMouseEnter={() => setSelectedIndex(index)}
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

