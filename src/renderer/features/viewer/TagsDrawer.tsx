import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import log from "electron-log/renderer";
import type { Artist, Post } from "@shared/types/db";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription as SheetDesc,
} from "../../components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Copy, Loader2 } from "lucide-react";
import { useSearchStore } from "../../store/searchStore";
import { useViewerStore, type ViewerOrigin } from "../../store/viewerStore";
import { cn } from "../../lib/utils";
import { VIEWER_OVERLAY_Z, viewerOverlayClass } from "./viewer-layers";

const VIEWER_TAG_HINT_SEEN_KEY = "hasSeenTagHint";
const RESOLVE_TAGS_BATCH_SIZE = 100;
const RESOLVED_TAG_VALUE_ROW_CLASS =
  "flex h-5 items-center text-sm text-muted-foreground";

type ResolvedTagFieldProps = {
  title: string;
  tags: string[];
  isResolving: boolean;
  emptyLabel: string;
  loadingLabel: string;
  renderTag: (tag: string) => ReactNode;
};

function ResolvedTagField({
  title,
  tags,
  isResolving,
  emptyLabel,
  loadingLabel,
  renderTag,
}: ResolvedTagFieldProps): ReactElement {
  let body: ReactNode;
  if (tags.length > 0) {
    body = <div className="min-h-5 space-y-1">{tags.map((tag) => renderTag(tag))}</div>;
  } else if (isResolving) {
    body = (
      <p
        className={RESOLVED_TAG_VALUE_ROW_CLASS}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={loadingLabel}
      >
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
      </p>
    );
  } else {
    body = <p className={RESOLVED_TAG_VALUE_ROW_CLASS}>{emptyLabel}</p>;
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {body}
    </div>
  );
}

const chunkTags = (tags: string[], chunkSize: number): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < tags.length; i += chunkSize) {
    chunks.push(tags.slice(i, i + chunkSize));
  }
  return chunks;
};

export const TagsDrawer = ({
  post,
  isOpen,
  onOpenChange,
  isFromBrowse: _isFromBrowse = false,
  queue: _queue,
}: {
  post: Post;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isFromBrowse?: boolean;
  queue: {
    ids: number[];
    origin: ViewerOrigin | undefined;
    totalGlobalCount?: number;
  } | null;
}) => {
  const navigate = useNavigate();
  const [hasSeenTagHint, setHasSeenTagHint] = useState<boolean>(() => {
    return window.localStorage.getItem(VIEWER_TAG_HINT_SEEN_KEY) === "true";
  });
  const [isPostIdCopied, setIsPostIdCopied] = useState(false);
  const addIncludeTag = useSearchStore((state) => state.addIncludeTag);
  const addExcludeTag = useSearchStore((state) => state.addExcludeTag);
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const setFilters = useSearchStore((state) => state.setFilters);
  const isTagIncluded = useSearchStore((state) => state.isTagIncluded);
  const isTagExcluded = useSearchStore((state) => state.isTagExcluded);

  const showTagHintForCurrentOpen = isOpen && !hasSeenTagHint;

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (open && !hasSeenTagHint) {
        window.localStorage.setItem(VIEWER_TAG_HINT_SEEN_KEY, "true");
        setHasSeenTagHint(true);
      }
      onOpenChange(open);
    },
    [hasSeenTagHint, onOpenChange]
  );

  useEffect(() => {
    if (!isPostIdCopied) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsPostIdCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isPostIdCopied]);

  const handleCopyPostId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(String(post.postId));
      setIsPostIdCopied(true);
    } catch (error) {
      log.error("[TagsDrawer] Failed to copy post ID:", error);
    }
  };

  // Get artist information - always fetch when drawer is open
  const { data: artists } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
    enabled: isOpen, // Always fetch when drawer is open
  });

  const artist = useMemo(() => {
    if (!artists || !post.artistId || post.artistId === EXTERNAL_ARTIST_ID) {
      return null;
    }
    const found = artists.find((a) => a.id === post.artistId);
    // Debug log to see if artist is found
    if (post.artistId && post.artistId !== EXTERNAL_ARTIST_ID && !found) {
      log.warn(`[TagsDrawer] Artist not found for post.artistId: ${post.artistId}`);
    }
    return found || null;
  }, [artists, post.artistId]);


  // Lazy batch resolver for artist tags (only for untracked posts)
  // Uses React Query to cache results and batch multiple tags in one request
  // Acts as a permanent session cache (staleTime: Infinity)
  // Uses IPC to call Main Process which has full access to credentials and persistent DB cache
  // Post.tags is always a string in the schema, but handle edge cases
  const tagsString = typeof post?.tags === "string" ? post.tags : '';
  const hasKnownArtist = !!artist;

  // Clean IPC call - no credentials passed from UI
  // Main Process handles authentication and persistent SQLite cache internally
  // Pass ALL tags to resolveTags - no client-side slice to ensure artist tags are found even if they're beyond position 20
  const { data: resolvedArtistTags = [], isLoading: isResolvingArtistTags } =
    useQuery<string[]>({
    queryKey: ['resolve-tags-ipc', tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(' ').filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];

      const tagChunks = chunkTags(tagsToAsk, RESOLVE_TAGS_BATCH_SIZE);
      const resolvedChunks = await Promise.all(
        tagChunks.map((chunk) => window.api.resolveTags(chunk))
      );
      return resolvedChunks.flat();
    },
    enabled: !!post && !hasKnownArtist && tagsString.length > 0,
    staleTime: Infinity, // Keep in RAM for session
    retry: false,
  });

  // Resolve character tags (type=4) from API
  const { data: resolvedCharacterTags = [], isLoading: isResolvingCharacterTags } =
    useQuery<string[]>({
    queryKey: ['resolve-character-tags-ipc', tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(' ').filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];

      const tagChunks = chunkTags(tagsToAsk, RESOLVE_TAGS_BATCH_SIZE);
      const resolvedChunks = await Promise.all(
        tagChunks.map((chunk) => window.api.resolveCharacterTags(chunk))
      );
      return resolvedChunks.flat();
    },
    enabled: !!post && tagsString.length > 0,
    staleTime: Infinity, // Keep in RAM for session
    retry: false,
  });

  // Resolve copyright tags (type=3) from API
  const { data: resolvedCopyrightTags = [], isLoading: isResolvingCopyrightTags } =
    useQuery<string[]>({
    queryKey: ['resolve-copyright-tags-ipc', tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(' ').filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];

      const tagChunks = chunkTags(tagsToAsk, RESOLVE_TAGS_BATCH_SIZE);
      const resolvedChunks = await Promise.all(
        tagChunks.map((chunk) => window.api.resolveCopyrightTags(chunk))
      );
      return resolvedChunks.flat();
    },
    enabled: !!post && tagsString.length > 0,
    staleTime: Infinity, // Keep in RAM for session
    retry: false,
  });

  // Group all tags by type in a single useMemo for better performance
  // This avoids multiple useMemo dependencies and reduces re-computation overhead
  const groupedTags = useMemo(() => {
    // Parse all tags from post
    const allTags: string[] = post?.tags
      ? (typeof post.tags === 'string' 
          ? post.tags.split(' ').filter(t => t.length > 0)
          : Array.isArray(post.tags) ? post.tags : [])
      : [];

    // Copyright tags (type=3)
    const copyright: string[] = resolvedCopyrightTags.length > 0
      ? allTags.filter(t => 
          resolvedCopyrightTags.some(r => r.toLowerCase() === t.toLowerCase())
        )
      : [];

    // Character tags (type=4)
    const character: string[] = resolvedCharacterTags.length > 0
      ? allTags.filter(t => 
          resolvedCharacterTags.some(r => r.toLowerCase() === t.toLowerCase())
        )
      : [];

    // Artist tags (type=1) - includes local DB artist and API resolved tags
    const artistTags: string[] = [];
    if (artist?.tag) {
      artistTags.push(artist.tag);
    }
    if (resolvedArtistTags.length > 0) {
      const apiTags = allTags.filter(t => 
        resolvedArtistTags.some(r => r.toLowerCase() === t.toLowerCase())
      );
      artistTags.push(...apiTags);
    }
    // Remove duplicates
    const uniqueArtist = [...new Set(artistTags)];

    // General tags (type=0) - all tags that are not Copyright, Character, or Artist
    const specialTags = new Set([
      ...copyright.map(t => t.toLowerCase()),
      ...character.map(t => t.toLowerCase()),
      ...uniqueArtist.map(t => t.toLowerCase()),
    ]);
    const general = allTags.filter(t => !specialTags.has(t.toLowerCase()));

    return {
      artist: uniqueArtist,
      character,
      copyright,
      general,
    };
  }, [
    post.tags,
    artist,
    resolvedArtistTags,
    resolvedCharacterTags,
    resolvedCopyrightTags,
  ]);

  // Destructure for backward compatibility with existing code
  const { artist: artistTags, character: characterTags, copyright: copyrightTags, general: generalTags } = groupedTags;

  const { close: closeViewer } = useViewerStore(
    useShallow((state) => ({
      close: state.close,
    }))
  );

  const handleTagInclude = (tag: string) => {
    closeViewer();
    onOpenChange(false);
    clearTagChips();
    setFilters({ source: "all" });
    addIncludeTag(tag);
    navigate("/browse");
  };

  const handleTagExclude = (tag: string) => {
    closeViewer();
    onOpenChange(false);
    clearTagChips();
    setFilters({ source: "all" });
    addExcludeTag(tag);
    navigate("/browse");
  };

  const renderTagActionButton = (
    tag: string,
    variant: "link" | "ghost",
    colorClassName: string,
    wrapperClassName: string
  ) => {
    return (
      <Button
        key={tag}
        type="button"
        variant={variant}
        onClick={() => handleTagInclude(tag)}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleTagExclude(tag);
        }}
        className={cn(
          wrapperClassName,
          colorClassName,
          isTagIncluded(tag) && "ring-1 ring-green-500 bg-green-500/10",
          isTagExcluded(tag) &&
            "ring-1 ring-red-500 bg-red-500/10 line-through opacity-60"
        )}
        title={
          isTagExcluded(tag)
            ? "Excluded (right-click to toggle)"
            : isTagIncluded(tag)
              ? "Included (right-click to exclude)"
              : "Click to include, right-click to exclude"
        }
        aria-pressed={isTagIncluded(tag) || isTagExcluded(tag)}
      >
        {tag}
      </Button>
    );
  };


  return (
    <Sheet open={isOpen} onOpenChange={handleDrawerOpenChange} modal>
      <SheetContent
        side="right"
        overlayClassName={cn(VIEWER_OVERLAY_Z, "bg-black/80")}
        className={cn(
          VIEWER_OVERLAY_Z,
          "w-full overflow-y-auto sm:max-w-md"
        )}
        style={{ scrollbarGutter: "stable" }}
      >
        <SheetHeader>
          <SheetTitle>Post Metadata</SheetTitle>
          <SheetDesc>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void handleCopyPostId();
                    }}
                    className="group h-auto px-1 py-0.5 text-xs font-normal text-muted-foreground hover:text-foreground"
                  >
                    <span>{isPostIdCopied ? "Copied!" : `Post ID: ${post.postId}`}</span>
                    <Copy className="ml-1 h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={viewerOverlayClass()}>
                  Click to copy
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SheetDesc>
        </SheetHeader>
        {showTagHintForCurrentOpen ? (
          <p className="px-1 pb-2 text-xs text-muted-foreground">
            Click to include · Right-click to exclude
          </p>
        ) : null}
        <div className="mt-6 space-y-4">
          {post.publishedAt && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Published</h3>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  let date: Date;
                  if (post.publishedAt instanceof Date) {
                    date = post.publishedAt;
                  } else if (typeof post.publishedAt === "number") {
                    date = new Date(post.publishedAt);
                  } else if (typeof post.publishedAt === "string") {
                    date = new Date(post.publishedAt);
                  } else {
                    return "Unknown";
                  }
                  if (isNaN(date.getTime())) return "Unknown";
                  return date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                })()}
              </p>
            </div>
          )}
          <ResolvedTagField
            title="Copyright"
            tags={copyrightTags}
            isResolving={isResolvingCopyrightTags}
            emptyLabel="No copyright detected"
            loadingLabel="Resolving copyright"
            renderTag={(tag) =>
              renderTagActionButton(
                tag,
                "link",
                "text-purple-600 hover:underline",
                "h-auto min-h-0 w-full justify-start p-0 text-sm"
              )
            }
          />
          <ResolvedTagField
            title="Character"
            tags={characterTags}
            isResolving={isResolvingCharacterTags}
            emptyLabel="No character detected"
            loadingLabel="Resolving character"
            renderTag={(tag) =>
              renderTagActionButton(
                tag,
                "link",
                "text-green-600 hover:underline",
                "h-auto min-h-0 w-full justify-start p-0 text-sm"
              )
            }
          />
          <ResolvedTagField
            title="Artist"
            tags={artistTags}
            isResolving={isResolvingArtistTags}
            emptyLabel="No artist detected"
            loadingLabel="Resolving artist"
            renderTag={(tag) =>
              renderTagActionButton(
                tag,
                "link",
                "text-red-600 hover:underline",
                "h-auto min-h-0 w-full justify-start p-0 text-sm"
              )
            }
          />
          {/* General Tags Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Tags ({generalTags.length})
            </h3>
            <div
              className="max-h-[400px] overflow-y-auto rounded-md border pr-2"
              style={{ scrollbarGutter: "stable" }}
            >
              <div>
                {generalTags.map((tag) => (
                  <Button
                    type="button"
                    key={tag}
                    variant="ghost"
                    onClick={() => handleTagInclude(tag)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleTagExclude(tag);
                    }}
                    className={cn(
                      "h-auto min-h-0 w-full justify-start rounded-none px-3 py-2 text-sm text-left font-normal border-b last:border-b-0 hover:bg-muted/50",
                      isTagIncluded(tag) && "ring-1 ring-green-500 bg-green-500/10",
                      isTagExcluded(tag) &&
                        "ring-1 ring-red-500 bg-red-500/10 line-through opacity-60"
                    )}
                    title={
                      isTagExcluded(tag)
                        ? "Excluded (right-click to toggle)"
                        : isTagIncluded(tag)
                          ? "Included (right-click to exclude)"
                          : "Click to include, right-click to exclude"
                    }
                    aria-pressed={isTagIncluded(tag) || isTagExcluded(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
