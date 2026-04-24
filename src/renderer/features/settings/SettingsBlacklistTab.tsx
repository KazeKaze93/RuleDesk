import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { invalidateAllPostQueries } from "../../utils/react-query-cache";
import { resolveErrorMessage } from "../../utils/error-message";
import { useRemoteTags } from "../../lib/hooks/useRemoteTags";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  CommandLoading,
} from "../../components/ui/command";

const MAX_BLACKLIST_TAGS = 100;

const normalizeTag = (value: string): string => value.trim().toLowerCase();
export const SettingsBlacklistTab = () => {
  const queryClient = useQueryClient();
  const [draftTag, setDraftTag] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: blacklistedTags = [], isLoading: isBlacklistLoading } = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => window.api.getBlacklistedTags(),
  });

  const tagsCount = blacklistedTags.length;
  const isLimitReached = tagsCount >= MAX_BLACKLIST_TAGS;
  const normalizedDraftTag = useMemo(() => normalizeTag(draftTag), [draftTag]);
  const { results, isLoading } = useRemoteTags({
    query: draftTag,
    minQueryLength: 2,
    debounceMs: 300,
    provider: "rule34",
  });

  const showSuggestions =
    listOpen && normalizedDraftTag.length >= 2 && (isLoading || results.length > 0);

  const refreshAfterMutation = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ["blacklist"] });
    await invalidateAllPostQueries(queryClient);
  };

  const addMutation = useMutation({
    mutationFn: async (tag: string) => {
      await window.api.addTagToBlacklist(tag);
    },
    onSuccess: async () => {
      setDraftTag("");
      await refreshAfterMutation();
      toast.success("Tag added to blacklist");
    },
    onError: (error) => {
      const message = resolveErrorMessage(error, "Failed to add tag");
      toast.error(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (tag: string) => {
      await window.api.removeTagFromBlacklist(tag);
    },
    onSuccess: async () => {
      await refreshAfterMutation();
      toast.success("Tag removed from blacklist");
    },
    onError: (error) => {
      const message = resolveErrorMessage(error, "Failed to remove tag");
      toast.error(message);
    },
  });

  const addTag = useCallback(
    (value: string): void => {
      const normalized = normalizeTag(value);
      if (!normalized || isLimitReached || blacklistedTags.includes(normalized)) {
        return;
      }
      addMutation.mutate(normalized);
      setListOpen(false);
      setSelectedIndex(-1);
    },
    [addMutation, blacklistedTags, isLimitReached]
  );

  const handleSelectFromList = useCallback(
    (value: string): void => {
      addTag(value);
      setDraftTag("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [addTag]
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (showSuggestions && results.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) =>
          current < results.length - 1 ? current + 1 : current
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) => (current > 0 ? current - 1 : -1));
        return;
      }
      if (
        event.key === "Enter"
      ) {
        event.preventDefault();
        const selected =
          selectedIndex >= 0 && selectedIndex < results.length
            ? results[selectedIndex]
            : results[0];
        if (selected) {
          handleSelectFromList(selected.value);
        }
        return;
      }
    }

    if (event.key === "Escape" && listOpen) {
      event.preventDefault();
      setListOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draftTag);
      return;
    }
  };

  const handleListPointerDown = (event: React.PointerEvent): void => {
    event.preventDefault();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (!containerRef.current || !event.target) {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      if (!containerRef.current.contains(event.target)) {
        setListOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Tag Blacklist</h3>
        <p className="text-sm text-muted-foreground">
          Blacklisted tags are excluded from every local post query.
        </p>
      </div>

      <div className="flex items-center gap-2" ref={containerRef}>
        <Popover
          open={showSuggestions}
          onOpenChange={(open) => {
            if (!open) {
              setListOpen(false);
              setSelectedIndex(-1);
            }
          }}
        >
          <PopoverAnchor asChild>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={inputRef}
                value={draftTag}
                onChange={(event) => {
                  setDraftTag(event.target.value);
                  const nextValue = normalizeTag(event.target.value);
                  if (nextValue.length >= 2) {
                    setListOpen(true);
                  } else {
                    setListOpen(false);
                  }
                  setSelectedIndex(-1);
                }}
                onFocus={() => {
                  if (normalizedDraftTag.length >= 2) {
                    setListOpen(true);
                  }
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Enter tag"
                maxLength={128}
                className="pl-8"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="w-[var(--radix-popover-anchor-width)] p-0"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onPointerDown={handleListPointerDown}
          >
            <Command shouldFilter={false} className="max-h-64">
              <CommandList>
                {isLoading ? (
                  <CommandLoading>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading...
                  </CommandLoading>
                ) : results.length === 0 ? (
                  <CommandEmpty>No tag suggestions</CommandEmpty>
                ) : (
                  results.map((result, index) => (
                    <CommandItem
                      key={result.id}
                      value={String(result.id)}
                      onSelect={() => handleSelectFromList(result.value)}
                      className={index === selectedIndex ? "bg-accent text-accent-foreground" : ""}
                    >
                      <span className="truncate">{result.label}</span>
                      {result.type ? (
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          ({result.type})
                        </span>
                      ) : null}
                    </CommandItem>
                  ))
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-sm text-muted-foreground">
        {tagsCount} / {MAX_BLACKLIST_TAGS} tags
      </p>

      <div className="flex flex-wrap gap-2">
        {isBlacklistLoading ? (
          <p className="text-sm text-muted-foreground">Loading blacklist...</p>
        ) : blacklistedTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No blacklisted tags yet.
          </p>
        ) : (
          blacklistedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              <span>{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                aria-label={`Remove ${tag} from blacklist`}
                onClick={() => removeMutation.mutate(tag)}
                disabled={removeMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
    </section>
  );
};
