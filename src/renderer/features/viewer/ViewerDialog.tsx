import { useEffect, useCallback, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription as SheetDesc,
} from "../../components/ui/sheet";
import { useShallow } from "zustand/react/shallow";
import { Virtuoso } from "react-virtuoso";
import log from "electron-log/renderer";
import { useViewerStore, ViewerOrigin } from "../../store/viewerStore";
import { Button } from "../../components/ui/button";
import {
  X,
  Heart,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Folder,
  Copy,
  RefreshCw,
  Bug,
  FileText,
  Tags,
  ExternalLink,
  Eye,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "../../components/ui/dropdown-menu";

import { useQueryClient, InfiniteData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { Post } from "../../../main/db/schema";
import type { Artist } from "../../../main/db/schema";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import { useSearchStore } from "../../store/searchStore";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";
import { useViewerController } from "./hooks/useViewerController";

const useCurrentPost = (
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
) => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!currentPostId || !origin) return undefined;

    // Helper to search in InfiniteData cache
    const findInCache = (queryKey: unknown[]): Post | undefined => {
      const data = queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);
      if (!data) return undefined;
      for (const page of data.pages) {
        const found = page.find((p) => p.id === currentPostId);
        if (found) return found;
      }
      return undefined;
    };

    let foundPost: Post | undefined;

    // Select cache based on origin - use EXACT query keys from components
    // Note: origin.tags may be undefined, but queryKey always includes tags array (even if empty)
    switch (origin.kind) {
      case "updates": {
        // Updates.tsx uses: ["posts", "updates", tags] where tags is always an array
        // But origin.tags may be undefined if tags.length === 0
        const tags = origin.tags ?? [];
        foundPost = findInCache(["posts", "updates", tags]);
        // Fallback: try with empty array if tags were undefined
        if (!foundPost && origin.tags === undefined) {
          foundPost = findInCache(["posts", "updates", []]);
        }
        break;
      }
      case "favorites": {
        // Favorites.tsx uses: ["posts", "favorites", tags] where tags is always an array
        const tags = origin.tags ?? [];
        foundPost = findInCache(["posts", "favorites", tags]);
        // Fallback: try with empty array if tags were undefined
        if (!foundPost && origin.tags === undefined) {
          foundPost = findInCache(["posts", "favorites", []]);
        }
        break;
      }
      case "artist": {
        // ArtistGallery uses: ["posts", artistId, tags] where tags is always an array
        const tags = origin.tags ?? [];
        foundPost = findInCache(["posts", origin.artistId, tags]);
        // Fallback: try with empty array if tags were undefined
        if (!foundPost && origin.tags === undefined) {
          foundPost = findInCache(["posts", origin.artistId, []]);
        }
        break;
      }
      case "search": {
        // Browse.tsx uses: ["search", tags] where tags is always an array
        foundPost = findInCache(["search", origin.tags]);
        break;
      }
      case "browse": {
        // Fallback for browse (if it exists)
        foundPost = findInCache(["search", []]);
        break;
      }
      default:
        return undefined;
    }

    // Fallback: If still not found, try to find in ANY 'posts' cache
    // This is a safety net for edge cases - try all possible query key variations
    if (!foundPost) {
      const fallbackKeys: unknown[][] = [];
      
      // Try all possible tag combinations for updates/favorites
      if (origin.kind === "updates" || origin.kind === "favorites") {
        const kind = origin.kind;
        // Try with empty array
        fallbackKeys.push(["posts", kind, []]);
        // Try with origin.tags if it exists
        if (origin.tags) {
          fallbackKeys.push(["posts", kind, origin.tags]);
        }
      }
      
      // Try search with empty array
      fallbackKeys.push(["search", []]);
      
      for (const key of fallbackKeys) {
        foundPost = findInCache(key);
        if (foundPost) break;
      }
    }

    return foundPost;
  }, [currentPostId, origin, queryClient]);
};

const ViewerMedia = ({ post }: { post: Post }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const { safeMode, panicMode, blurAmount } = useSafeModeStore();
  const shouldBlur = shouldBlurPost(post.rating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);

  const isVideo =
    post.fileUrl.endsWith(".mp4") || post.fileUrl.endsWith(".webm");

  useEffect(() => {
    const handleMediaKeys = (e: KeyboardEvent) => {
      if (e.key === " ") {
        if (document.activeElement?.tagName === "VIDEO") {
          return;
        }
        e.preventDefault();
        setIsVideoPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", handleMediaKeys);
    return () => window.removeEventListener("keydown", handleMediaKeys);
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isVideo) {
      if (e.target instanceof HTMLVideoElement) return;
      setIsVideoPlaying((v) => !v);
      return;
    }
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      className="flex relative justify-center items-center pb-20 w-full h-full cursor-default overflow-auto"
      onClick={handleContainerClick}
    >
      {isVideo ? (
        <div
          style={{
            filter: shouldBlur
              ? `blur(${effectiveBlur}px)`
              : undefined,
          }}
        >
          <video
            src={post.fileUrl}
            className="object-contain max-w-full max-h-full outline-none focus:outline-none"
            autoPlay={isVideoPlaying}
            loop
            controls
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            ref={(el) => {
              if (el) {
                if (isVideoPlaying && el.paused) el.play().catch(() => {});
                else if (!isVideoPlaying && !el.paused) el.pause();
              }
            }}
          />
        </div>
      ) : (
        <img
          src={isZoomed ? post.fileUrl : post.sampleUrl || post.fileUrl}
          alt={`Post ${post.id}`}
          className={cn(
            "transition-all duration-300 ease-out",
            isZoomed
              ? "max-w-none max-h-none cursor-zoom-out"
              : "object-contain max-w-full max-h-full cursor-zoom-in"
          )}
        />
      )}
    </div>
  );
};


const TagsDrawer = ({
  post,
  isOpen,
  onOpenChange,
  isFromBrowse = false,
  queue,
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
  const { setQuery } = useSearchStore();

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

  // Get all tags and identify artist tag if it exists in the tag list
  // Artist tag might be in different format (e.g., "user:username" vs "username")
  // We need to check both the raw tag and formatted versions
  const allTags = useMemo(() => {
    if (!post.tags) return [];
    // Create a COPY to avoid mutation issues
    const tagsArray = typeof post.tags === "string" 
      ? post.tags.trim().split(/\s+/).filter(Boolean)
      : Array.isArray(post.tags) 
        ? [...post.tags]
        : [];
    return tagsArray;
  }, [post.tags]);
  
  // Compute priority tags set (context-aware tag pinning)
  // Combines DB Artist info + Search Context + Artist Context
  const priorityTags = useMemo(() => {
    const tags = new Set<string>();
    
    // 1. DB Artists (Hard Truth)
    if (artist?.name) {
      tags.add(artist.name.toLowerCase().replace(/ /g, '_'));
    }
    if (artist?.tag) {
      tags.add(artist.tag.toLowerCase());
      // Also add formatted versions
      const formattedTag = artist.type === "uploader" 
        ? `user:${artist.tag.toLowerCase().replace(/ /g, "_")}`
        : artist.tag.toLowerCase().replace(/ /g, "_");
      tags.add(formattedTag);
    }
    
    // 2. Search Context (UX Heuristic)
    // If user searched for "jamesbron", pin "jamesbron" even if untracked.
    if (queue?.origin?.kind === 'search' && queue.origin.tags) {
      queue.origin.tags.forEach(t => tags.add(t.toLowerCase()));
    }
    
    // 3. Artist Context
    if (queue?.origin?.kind === 'artist' && queue.origin.tags) {
      queue.origin.tags.forEach(t => tags.add(t.toLowerCase()));
    }
    
    return tags;
  }, [artist, queue]);

  // Identify artist tag in the tag list
  // Check both artist.tag and formatted versions (user:username for uploader, lowercase for tag)
  const artistTagInList = useMemo(() => {
    if (!artist || allTags.length === 0) return null;
    
    // Check exact match
    if (allTags.includes(artist.tag)) return artist.tag;
    
    // Check formatted versions
    const formattedTag = artist.type === "uploader" 
      ? `user:${artist.tag.toLowerCase().replace(/ /g, "_")}`
      : artist.tag.toLowerCase().replace(/ /g, "_");
    
    if (allTags.includes(formattedTag)) return formattedTag;
    
    // Check if any tag starts with user: for uploader type
    if (artist.type === "uploader") {
      const userTag = allTags.find(tag => tag.startsWith("user:") && tag.includes(artist.tag.toLowerCase()));
      if (userTag) return userTag;
    }
    
    return null;
  }, [artist, allTags]);
  
  // Helper function to check if a tag matches any priority tag (fuzzy matching)
  // Checks both exact match and if tag includes priority tag (e.g., "jamesbron_(official)" contains "jamesbron")
  const matchesPriorityTag = useCallback((tag: string): boolean => {
    const tagLower = tag.toLowerCase();
    
    // Check exact match first
    if (priorityTags.has(tagLower)) return true;
    
    // Fuzzy matching: check if tag includes any priority tag
    for (const priorityTag of priorityTags) {
      if (tagLower.includes(priorityTag) || priorityTag.includes(tagLower)) {
        return true;
      }
    }
    
    return false;
  }, [priorityTags]);

  // Sort tags: priority tags first, then others
  const sortedTags = useMemo(() => {
    if (!post?.tags) return [];
    
    // Normalize string to array
    const tagsArray = typeof post.tags === 'string' 
      ? post.tags.split(' ').filter(t => t.length > 0)
      : Array.isArray(post.tags) ? post.tags : [];

    return tagsArray.sort((a, b) => {
      const tagA = a.toLowerCase();
      const tagB = b.toLowerCase();
      
      // Check if tags match priority set (fuzzy matching)
      const isAPriority = matchesPriorityTag(a);
      const isBPriority = matchesPriorityTag(b);
      
      // Force priority tags to front
      if (isAPriority && !isBPriority) return -1;
      if (!isAPriority && isBPriority) return 1;
      
      return tagA.localeCompare(tagB);
    });
  }, [post?.tags, matchesPriorityTag]);
  
  // Filter out artist tag from the list (it's shown in header separately)
  const tags = useMemo(() => {
    if (!artistTagInList) return sortedTags;
    return sortedTags.filter(tag => tag !== artistTagInList);
  }, [sortedTags, artistTagInList]);

  // Helper function to check if a tag is a priority tag (artist or search context)
  // Uses fuzzy matching to catch variations like "jamesbron_(official)"
  const isPriorityTag = useCallback((tag: string): boolean => {
    return matchesPriorityTag(tag);
  }, [matchesPriorityTag]);

  const { close: closeViewer } = useViewerStore(
    useShallow((state) => ({
      close: state.close,
    }))
  );

  const handleTagClick = (tag: string) => {
    closeViewer(); // Close viewer first
    onOpenChange(false); // Close drawer
    setQuery(tag);
    navigate("/browse");
  };

  const handleArtistClick = () => {
    if (artist?.tag) {
      closeViewer(); // Close viewer first
      onOpenChange(false); // Close drawer
      setQuery(artist.tag);
      navigate("/browse");
    }
  };

  // Component for artist header
  const ArtistHeader = () => {
    if (!artist) return null;

    const tagToShow = artistTagInList || artist.tag;

    return (
      <div className="sticky top-0 z-10 px-3 py-2 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
        <button
          onClick={handleArtistClick}
          className="flex w-full items-center gap-2 text-left hover:bg-primary/20 rounded transition-colors cursor-pointer"
        >
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Artist
          </span>
          <span className="text-sm font-medium text-primary">
            {artist.name}
          </span>
          {tagToShow && (
            <span className="ml-auto text-xs text-primary/70 font-mono">
              {tagToShow}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Post Metadata</SheetTitle>
          <SheetDesc>Post ID: {post.postId}</SheetDesc>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Rating</h3>
            <span
              className={cn(
                "inline-block px-2 py-1 rounded text-xs font-bold uppercase",
                post.rating === "e"
                  ? "bg-red-500/20 text-red-400"
                  : post.rating === "q"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
              )}
            >
              {post.rating === "s"
                ? "Safe"
                : post.rating === "q"
                ? "Questionable"
                : "Explicit"}
            </span>
          </div>
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
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Tags ({tags.length + (artist ? 1 : 0)})
            </h3>
            <div className="max-h-[400px] overflow-hidden rounded-md border">
              <Virtuoso
                style={{ height: "400px" }}
                data={tags}
                components={{
                  Header: artist ? ArtistHeader : undefined,
                }}
                itemContent={(index, tag) => {
                  // Check if this tag is a priority tag (artist or search context)
                  const tagIsPriority = isPriorityTag(tag);
                  
                  return (
                    <button
                      onClick={() => handleTagClick(tag)}
                      className={cn(
                        "w-full px-3 py-2 text-sm text-left border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
                        tagIsPriority && "bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-amber-500/30 font-bold"
                      )}
                    >
                      {tag}
                    </button>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ViewerContent = ({
  post,
  queue,
  close,
  next,
  prev,
  controlsVisible,
  toggleTagsDrawer,
  isTagsDrawerOpen,
}: {
  post: Post;
  queue: {
    ids: number[];
    origin: ViewerOrigin | undefined;
    totalGlobalCount?: number;
  } | null;
  close: () => void;
  next: () => void;
  prev: () => void;
  controlsVisible: boolean;
  toggleTagsDrawer: () => void;
  isTagsDrawerOpen: boolean;
}) => {
  const ctrl = useViewerController({ post, queue });
  const isDeveloperMode = true;

  const handleToggleFavorite = useCallback(async () => {
    await ctrl.toggleFavorite();
  }, [ctrl]);

  const handleMarkViewed = useCallback(async () => {
    if (post.isViewed) return;
    await window.api.markPostAsViewed(post.id);
  }, [post]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      switch (e.key) {
        case "f":
        case "F":
          e.preventDefault();
          handleToggleFavorite();
          break;
        case "v":
        case "V":
          e.preventDefault();
          handleMarkViewed();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleFavorite, handleMarkViewed]);

  return (
    <>
      <ViewerMedia post={post} />

      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300",
          !controlsVisible && "-translate-y-full"
        )}
      >
        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="text-white rounded-full hover:bg-white/10"
            aria-label="Close viewer"
            title="Close viewer (Escape)"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className="text-white rounded-full hover:bg-white/10"
            aria-label={ctrl.isFavorited ? "Remove from favorites" : "Add to favorites"}
            title="Toggle Favorite (F)"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                ctrl.isFavorited ? "text-red-500 fill-red-500" : "text-white"
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMarkViewed}
            className="text-white rounded-full hover:bg-white/10"
            aria-label={post.isViewed ? "Mark as unviewed" : "Mark as viewed"}
            title="Mark as Viewed (V)"
          >
            <Eye
              className={cn(
                "w-5 h-5 transition-colors",
                post.isViewed ? "text-primary fill-primary" : "text-white"
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={ctrl.downloadImage}
            disabled={ctrl.isCurrentlyDownloading}
            className="overflow-hidden relative text-white rounded-full hover:bg-white/10 group"
            aria-label={
              ctrl.isCurrentlyDownloading
                ? `Downloading: ${ctrl.downloadProgress}%`
                : "Download original image"
            }
            title={
              ctrl.isCurrentlyDownloading
                ? `Скачивание ${ctrl.downloadProgress}%`
                : "Download Original"
            }
          >
            {ctrl.isCurrentlyDownloading && (
              <div
                className="absolute inset-0 transition-all duration-100 bg-green-500/50"
                style={{ width: `${ctrl.downloadProgress}%` }}
              />
            )}

            {ctrl.isCurrentlyDownloading ? (
              <div className="flex relative z-10 items-center text-xs text-white/90">
                {ctrl.downloadProgress}%
              </div>
            ) : (
              <Download className="relative z-10 w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full hover:bg-white/10"
                aria-label="More options"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 text-white shadow-lg bg-neutral-900 border-white/10"
              sideOffset={8}
              align="end"
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy...
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48 text-white shadow-xl bg-neutral-900 border-white/10">
                    <DropdownMenuItem
                      onClick={() => ctrl.handleCopyText(String(post.postId))}
                    >
                      Copy post ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => ctrl.handleCopyText(ctrl.postPageUrl)}
                    >
                      Copy post link
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={!post.tags}
                      onClick={() => ctrl.handleCopyText(post.tags || "")}
                    >
                      Copy tags (all)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!ctrl.tagQuery}
                      onClick={() => ctrl.handleCopyText(ctrl.tagQuery)}
                    >
                      Copy tags (query)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => ctrl.handleCopyText(post.fileUrl)}
                    >
                      Copy file URL
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Open</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => ctrl.handleOpenExternal(ctrl.postPageUrl)}
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                Open post page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={ctrl.openFolder}>
                <Folder className="mr-2 w-4 h-4" />
                Reveal in folder
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={ctrl.downloadImage}>
                <Download className="mr-2 w-4 h-4" />
                Re-download original
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isDeveloperMode && (
                <>
                  <DropdownMenuLabel>Developer</DropdownMenuLabel>
                  <DropdownMenuItem onClick={ctrl.resetLocalCache}>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Reset local cache
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={ctrl.handleCopyMetadata}>
                    <FileText className="mr-2 w-4 h-4" />
                    Show metadata
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={ctrl.handleCopyDebugInfo}>
                    <Bug className="mr-2 w-4 h-4" />
                    Copy debug info
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-transform duration-300",
          !controlsVisible && "translate-y-full"
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold uppercase",
                post.rating === "e"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-green-500/20 text-green-400"
              )}
            >
              {post.rating === "s"
                ? "Safe"
                : post.rating === "q"
                ? "Questionable"
                : "Explicit"}
            </span>
            {post.publishedAt && (() => {
              let date: Date;
              if (post.publishedAt instanceof Date) {
                date = post.publishedAt;
              } else if (typeof post.publishedAt === "number") {
                date = new Date(post.publishedAt);
              } else if (typeof post.publishedAt === "string") {
                date = new Date(post.publishedAt);
              } else {
                return null;
              }
              
              // Validate date is not invalid
              if (isNaN(date.getTime())) {
                return null;
              }
              
              return (
                <span className="text-xs text-white/70">
                  {date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTagsDrawer}
            className="gap-2 text-white bg-white/5 border-white/10 hover:bg-white/10"
            aria-label="Show tags"
            title="Show tags (T)"
          >
            <Tags className="w-4 h-4" />
            Tags
          </Button>
        </div>
      </div>

      <TagsDrawer
        post={post}
        isOpen={isTagsDrawerOpen}
        onOpenChange={toggleTagsDrawer}
        isFromBrowse={queue?.origin?.kind === "browse" || queue?.origin?.kind === "search"}
        queue={queue}
      />

      <button
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors outline-none",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        aria-label="Previous post"
        title="Previous post (Left Arrow)"
      >
        <ChevronLeft className="w-10 h-10 drop-shadow-md" />
      </button>

      <button
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors outline-none",
          !controlsVisible && "opacity-0"
        )}
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Next post"
        title="Next post (Right Arrow)"
      >
        <ChevronRight className="w-10 h-10 drop-shadow-md" />
      </button>
    </>
  );
};

export const ViewerDialog = () => {
  // Split Zustand selectors into logical groups to minimize re-renders
  const { isOpen, close } = useViewerStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      close: state.close,
    }))
  );

  const { currentPostId, queue } = useViewerStore(
    useShallow((state) => ({
      currentPostId: state.currentPostId,
      queue: state.queue,
    }))
  );

  const { currentIndex, next, prev } = useViewerStore(
    useShallow((state) => ({
      currentIndex: state.currentIndex,
      next: state.next,
      prev: state.prev,
    }))
  );

  const { controlsVisible, setControlsVisible, isTagsDrawerOpen, toggleTagsDrawer } = useViewerStore(
    useShallow((state) => ({
      controlsVisible: state.controlsVisible,
      setControlsVisible: state.setControlsVisible,
      isTagsDrawerOpen: state.isTagsDrawerOpen,
      toggleTagsDrawer: state.toggleTagsDrawer,
    }))
  );

  const { appendQueueIds } = useViewerStore(
    useShallow((state) => ({
      appendQueueIds: state.appendQueueIds,
    }))
  );

  const post = useCurrentPost(currentPostId, queue?.origin);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    const loadedCount = queue.ids.length;
    const threshold = 5;

    const isNearEnd = currentIndex >= loadedCount - threshold;
    const hasReachedLimit =
      (queue.totalGlobalCount && loadedCount >= queue.totalGlobalCount) ||
      !queue.hasNextPage;

    if (isNearEnd && !hasReachedLimit) {
      if (queue.onLoadMore) {
        log.info(
          `[Viewer] Triggering onLoadMore callback at index ${currentIndex}. Loaded: ${loadedCount}`
        );
        queue.onLoadMore();
        return;
      }
    }
  }, [isOpen, queue, currentIndex]);

  const artistId =
    queue?.origin?.kind === "artist" ? queue.origin.artistId : null;
  const queueIdsLength = queue?.ids.length ?? 0;
  const hasOnLoadMore = !!queue?.onLoadMore;

  useEffect(() => {
    if (!isOpen || !queue || !queue.origin) return;

    if (!queue.onLoadMore) return;

    // Query keys are consistent with component query keys:
    // - Artist gallery: ["posts", artistId] or ["posts", artistId, tags]
    // - Favorites: ["posts", "favorites"] or ["posts", "favorites", tags]
    // - Updates: ["posts", "updates"] or ["posts", "updates", tags]
    // - Search: ["search", tags]
    let queryKey: unknown[] = [];
    if (queue.origin.kind === "artist") {
      queryKey = queue.origin.tags && queue.origin.tags.length > 0
        ? ["posts", queue.origin.artistId, queue.origin.tags]
        : ["posts", queue.origin.artistId];
    } else if (queue.origin.kind === "favorites") {
      queryKey = queue.origin.tags && queue.origin.tags.length > 0
        ? ["posts", "favorites", queue.origin.tags]
        : ["posts", "favorites"];
    } else if (queue.origin.kind === "updates") {
      queryKey = queue.origin.tags && queue.origin.tags.length > 0
        ? ["posts", "updates", queue.origin.tags]
        : ["posts", "updates"];
    } else if (queue.origin.kind === "search") {
      queryKey = ["search", queue.origin.tags];
    } else {
      return;
    }

    const infiniteData =
      queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);

    if (infiniteData) {
      const allLoadedPosts = infiniteData.pages.flatMap((page) => page);
      const loadedPostIds = new Set(queue.ids);
      const newPosts = allLoadedPosts.filter((p) => !loadedPostIds.has(p.id));

      if (newPosts.length > 0) {
        const newPostIds = newPosts.map((p) => p.id);
        appendQueueIds(newPostIds);
      }
    }
  }, [
    isOpen,
    queue,
    queueIdsLength,
    artistId,
    hasOnLoadMore,
    queryClient,
    appendQueueIds,
  ]);

  const handleNavigationKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      // Don't handle shortcuts when user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          if (isTagsDrawerOpen) {
            toggleTagsDrawer();
          } else {
            close();
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          // Favorite toggle will be handled in ViewerContent
          break;
        case "v":
        case "V":
          e.preventDefault();
          // Mark viewed will be handled in ViewerContent
          break;
        case "t":
        case "T":
          e.preventDefault();
          toggleTagsDrawer();
          break;
      }
    },
    [isOpen, next, prev, close, isTagsDrawerOpen, toggleTagsDrawer]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleNavigationKeys);
    return () => window.removeEventListener("keydown", handleNavigationKeys);
  }, [handleNavigationKeys]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 2000);
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      setControlsVisible(true);
      timeout = setTimeout(() => setControlsVisible(false), 2000);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isOpen, setControlsVisible]);

  // Guard: only render when store says dialog should be open
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="
          fixed inset-0 left-0 top-0 translate-x-0 translate-y-0
          z-50 flex flex-col
          w-screen h-screen max-w-none
          p-0 m-0 gap-0
          border-none bg-transparent shadow-none outline-none
          sm:rounded-none
          [&>button]:hidden
        "
      >
        {/* Accessibility: Title and Description must be direct children of DialogContent */}
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <DialogDescription className="sr-only">
          View and navigate through posts. Use arrow keys to navigate, Escape to
          close.
        </DialogDescription>

        <div className="absolute inset-0 backdrop-blur-md pointer-events-none bg-black/60" />

        <div className="flex relative z-10 flex-col justify-center items-center w-full h-full">
          {post ? (
            <ViewerContent
              key={post.id}
              post={post}
              queue={queue}
              close={close}
              next={next}
              prev={prev}
              controlsVisible={controlsVisible}
              toggleTagsDrawer={toggleTagsDrawer}
              isTagsDrawerOpen={isTagsDrawerOpen}
            />
          ) : currentPostId !== null && queue ? (
            // Post not found in cache - show error message
            <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-white">
              <div className="text-lg font-semibold">Post not found in cache</div>
              <div className="text-sm text-white/70">
                Post ID: {currentPostId}
                <br />
                Origin: {queue.origin.kind}
              </div>
              <Button
                variant="outline"
                onClick={close}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          ) : (
            // Loading state
            <div className="flex items-center justify-center w-full h-full text-white">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
