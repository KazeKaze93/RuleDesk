import { useEffect, useCallback, useState, useMemo, useRef } from "react";
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
  List,
  Plus,
  Shuffle,
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
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import type { Post } from "../../../main/db/schema";
import type { Artist } from "../../../main/db/schema";
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";
import { parsePlaylistQuery } from "../../../shared/schemas/playlist";
import { useSearchStore } from "../../store/searchStore";
import { useSafeModeStore, shouldBlurPost, getEffectiveBlurAmount } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";
import { isVideoPost } from "../../lib/filter-utils";
import { useViewerController } from "./hooks/useViewerController";
import { QuickAddToPlaylistMenu } from "../../components/playlists/QuickAddToPlaylistMenu";

/**
 * PostNotFoundFallback: Handles shadow insert for remote posts not in cache
 * 
 * When a post from a playlist is not found in cache, this component:
 * 1. Checks if it's a remote post (id=0) in infiniteData
 * 2. If found, triggers shadow insert to cache it in local DB
 * 3. After insert, updates the cache and renders the post
 */
const PostNotFoundFallback = ({
  currentPostId,
  queue,
  infiniteData,
  onPostFound,
  onClose,
}: {
  currentPostId: number;
  queue: {
    ids: number[];
    origin: ViewerOrigin | undefined;
    totalGlobalCount?: number;
  };
  infiniteData?: InfiniteData<Post[]>;
  onPostFound: (post: Post) => React.ReactNode;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [isInserting, setIsInserting] = useState(false);
  const [insertedPost, setInsertedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // AbortController для отмены запросов при быстром переключении постов
  // Предотвращает забивание очереди ненужными запросами
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Отменить предыдущий запрос при изменении currentPostId
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Try to find remote post in infiniteData
    // Only attempt shadow insert for playlist origin (remote posts from playlists)
    if (!infiniteData || queue.origin?.kind !== "playlist") {
      // For non-playlist origins, if post is not found, it's a real error
      // Don't attempt shadow insert - these posts should already be in cache
      if (!infiniteData) {
        setError("Post not found in cache. This may indicate a data synchronization issue.");
      }
      return;
    }

    const allPosts = infiniteData.pages.flat();
    const foundPost = allPosts.find((p) => 
      p.id === currentPostId || (p.id === 0 && p.postId === currentPostId)
    );

    if (!foundPost || foundPost.id !== 0) {
      // Not a remote post or not found - show error
      if (!foundPost) {
        setError(`Post not found in cache (ID: ${currentPostId})`);
      }
      return;
    }

    // Found remote post - trigger shadow insert
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const performShadowInsert = async () => {
      // Check if request was already aborted before starting
      if (abortController.signal.aborted) {
        return;
      }
      
      setIsInserting(true);
      setError(null);

      try {
        // Validate required field
        if (!foundPost.postId) {
          throw new Error("Post ID is required for shadow insert");
        }

        // CRITICAL SECURITY: Renderer only passes postId and provider to Main process.
        // Main process fetches post data from API to ensure data integrity.
        // This prevents Renderer from injecting malicious URLs or data.
        
        // Determine provider from playlist metadata or origin
        // Priority: 1) origin.provider (from playlist queryJson), 2) fetched playlist provider, 3) default rule34
        let provider: "rule34" | "gelbooru" = "rule34";
        
        if (queue.origin?.kind === "playlist") {
          // First, check if provider is already in origin (from playlist queryJson)
          if (queue.origin.provider) {
            provider = queue.origin.provider;
          } else {
            // Fallback: fetch playlist to get provider from queryJson
            // Check abort signal before async operation
            if (abortController.signal.aborted) {
              return;
            }
            
            try {
              const playlist = await window.api.getPlaylist(queue.origin.playlistId);
              
              // Check abort signal after async operation
              if (abortController.signal.aborted) {
                return;
              }
              
              // SECURITY: Validate queryJson using parsePlaylistQuery utility
              // This prevents crashes from invalid JSON or malicious data
              if (playlist?.isSmart && playlist.queryJson) {
                const parsedQuery = parsePlaylistQuery(
                  playlist.queryJson,
                  playlist.querySchemaVersion
                );
                if (parsedQuery?.provider) {
                  provider = parsedQuery.provider;
                }
              }
            } catch (error) {
              // Ignore errors if request was aborted
              if (abortController.signal.aborted) {
                return;
              }
              log.warn(`[ViewerDialog] Failed to get playlist for provider detection:`, error);
              // Fallback to default provider
            }
          }
        }
        
        // Check abort signal before shadow insert
        if (abortController.signal.aborted) {
          return;
        }
        
        // Perform shadow insert - Main process fetches data from API
        const insertedPost = await window.api.shadowInsertPost({
          postId: foundPost.postId,
          provider,
        });
        
        // CRITICAL: Check if request was aborted after async operation
        // If user switched posts, ignore the result to prevent stale data
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Shadow insert aborted for postId ${foundPost.postId} (user switched posts)`);
          return;
        }
        
        log.info(`[ViewerDialog] Shadow insert successful: postId ${foundPost.postId} -> local id ${insertedPost.id}`);

        // CRITICAL: Check if component is still mounted and currentPostId hasn't changed
        // before updating cache to prevent race conditions
        // If user closed dialog or switched posts, don't mutate global cache
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Skipping cache update - request was aborted (user switched posts)`);
          return;
        }
        
        // Double-check: verify currentPostId matches the post we just inserted
        // This prevents updating cache for a post that's no longer being viewed
        if (currentPostId !== foundPost.postId && currentPostId !== foundPost.postId) {
          log.debug(`[ViewerDialog] Skipping cache update - currentPostId changed (${currentPostId} vs ${foundPost.postId})`);
          return;
        }

        // Update cache with inserted post (no setTimeout needed - we have the post object)
        if (queue.origin && queue.origin.kind === "playlist") {
          const queryKey = ["playlist-posts", queue.origin.playlistId, queue.origin.mediaType ?? "all", queue.origin.sortOrder ?? "desc"];
          
          // Update cache directly with inserted post
          // Use functional update to ensure we're working with latest cache state
          queryClient.setQueryData<InfiniteData<Post[]>>(queryKey, (oldData) => {
            if (!oldData) return oldData;
            
            // Replace remote post (id=0) with inserted post in cache
            const updatedPages = oldData.pages.map(page =>
              page.map(p => 
                (p.id === 0 && p.postId === foundPost.postId) ? insertedPost : p
              )
            );
            
            return {
              ...oldData,
              pages: updatedPages,
            };
          });
        }
        
        // Use the returned post directly (no setTimeout needed)
        setInsertedPost(insertedPost);
        setIsInserting(false);
      } catch (err) {
        // Ignore errors if request was aborted (user switched posts)
        if (abortController.signal.aborted) {
          log.debug(`[ViewerDialog] Shadow insert error ignored (request aborted):`, err);
          return;
        }
        
        log.error(`[ViewerDialog] Shadow insert failed for postId ${foundPost.postId}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage || "Failed to cache post");
        setIsInserting(false);
      }
    };

    performShadowInsert();
    
    // Cleanup: abort request on unmount or when currentPostId changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentPostId, infiniteData, queue, queryClient]);

  // If post was inserted, render it
  if (insertedPost) {
    return <>{onPostFound(insertedPost)}</>;
  }

  // Show loading or error state
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full text-white">
      {isInserting ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin" />
          <div className="text-lg font-semibold">Caching post...</div>
          <div className="text-sm text-white/70">
            Post ID: {currentPostId}
          </div>
        </>
      ) : error ? (
        <>
          <div className="text-lg font-semibold">Failed to cache post</div>
          <div className="text-sm text-white/70">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                // Reset error state and trigger retry by clearing insertedPost
                setError(null);
                setInsertedPost(null);
                setIsInserting(false);
                // Trigger useEffect again by clearing abortController
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
              }}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-lg font-semibold">Post not found in cache</div>
          <div className="text-sm text-white/70">
            Post ID: {currentPostId}
            <br />
            Origin: {queue.origin?.kind}
            {queue.origin?.kind === "playlist" && (
              <>
                <br />
                Playlist ID: {queue.origin.playlistId}
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Close
          </Button>
        </>
      )}
    </div>
  );
};

const useCurrentPost = (
  currentPostId: number | null,
  origin: ViewerOrigin | undefined
) => {
  const queryClient = useQueryClient();

  // Build query key based on origin
  const queryKey = useMemo(() => {
    if (!origin) return null;
    
    switch (origin.kind) {
      case "updates": {
        const tags = origin.tags ?? [];
        return ["posts", "updates", tags] as const;
      }
      case "favorites": {
        const tags = origin.tags ?? [];
        return ["posts", "favorites", tags] as const;
      }
      case "artist": {
        // CRITICAL: Match query key from ArtistGallery.tsx
        // QueryKey includes: ["posts", artistId, aiFilter, mediaType, source, sortOrder]
        // This ensures cache lookup matches the query key used for fetching artist posts
        const aiFilter = origin.aiFilter ?? "all";
        const mediaType = origin.mediaType ?? "all";
        const source = origin.source ?? "all";
        const sortOrder = origin.sortOrder ?? "desc";
        return [
          "posts",
          origin.artistId,
          aiFilter,
          mediaType,
          source,
          sortOrder,
        ] as const;
      }
      case "search": {
        return ["search", origin.tags] as const;
      }
      case "browse": {
        return ["search", []] as const;
      }
      case "playlist": {
        // Match query key from PlaylistGallery: ["playlist-posts", playlistId, mediaType, sortOrder]
        return ["playlist-posts", origin.playlistId, origin.mediaType ?? "all", origin.sortOrder ?? "desc"] as const;
      }
      default:
        return null;
    }
  }, [origin]);

  // Use useQuery with enabled: false for reactive cache access
  // This ensures component re-renders when cache data changes (e.g., post marked as viewed)
  // initialData is set from cache, and useQuery will reactively update when cache changes
  const { data: infiniteData } = useQuery<InfiniteData<Post[]>>({
    queryKey: queryKey ?? ["__invalid__"],
    queryFn: async () => {
      // This should never be called since enabled: false
      // But TypeScript requires a valid queryFn
      const cached = queryKey ? queryClient.getQueryData<InfiniteData<Post[]>>(queryKey) : undefined;
      if (!cached) throw new Error("useCurrentPost: No cached data available");
      return cached;
    },
    enabled: queryKey !== null && currentPostId !== null,
    initialData: queryKey ? queryClient.getQueryData<InfiniteData<Post[]>>(queryKey) : undefined,
    staleTime: Infinity, // Never refetch, only use cache
    gcTime: Infinity, // Keep in cache forever
  });

  // Optimize: Create Map for O(1) lookup instead of O(N) find() on every slide change
  // Trade-off: Map creation is O(N) but happens only when infiniteData changes (new pages or cache updates)
  // For 1000+ posts, O(1) lookup on slide change is much better than O(N) search
  // Map is recreated when infiniteData reference changes (React Query updates reference on cache changes)
  // Support both id (local posts) and postId (remote posts with id=0) lookup
  const postsMap = useMemo(() => {
    if (!infiniteData) return new Map<number, Post>();
    
    // Create Map from all pages for O(1) lookup
    // Use both id and postId as keys to support remote posts (id=0)
    const map = new Map<number, Post>();
    for (const page of infiniteData.pages) {
      for (const post of page) {
        map.set(post.id, post);
        // For remote posts (id=0), also index by postId for lookup
        if (post.id === 0 && post.postId) {
          map.set(post.postId, post);
        }
      }
    }
    return map;
  }, [infiniteData]); // Recreate when infiniteData changes (includes cache updates)

  // O(1) lookup using Map - much faster than O(N) find() for large datasets
  // Try id first, then postId for remote posts
  return useMemo(() => {
    if (!currentPostId || postsMap.size === 0) return undefined;
    // First try direct id lookup (works for local posts)
    const postById = postsMap.get(currentPostId);
    if (postById) return postById;
    // If not found, currentPostId might be a postId (for remote posts with id=0)
    // This handles the case where remote posts have id=0 but we're searching by postId
    // The map already has postId entries for remote posts, so this will find them
    return undefined;
  }, [currentPostId, postsMap]);
};

const IMAGE_MIN_SCALE = 1;
const IMAGE_MAX_SCALE = 8;
const IMAGE_WHEEL_STEP = 0.005;
const ZOOM_RESET_KEY = "0";
const RESOLVE_TAGS_BATCH_SIZE = 100;
let isImagePanningActive = false;

const chunkTags = (tags: string[], chunkSize: number): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < tags.length; i += chunkSize) {
    chunks.push(tags.slice(i, i + chunkSize));
  }
  return chunks;
};

const ViewerMedia = ({
  post,
  onBackgroundClick,
}: {
  post: Post;
  onBackgroundClick: () => void;
}) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const { safeMode, panicMode, blurAmount } = useSafeModeStore();
  
  // Reset fallback flag when post changes
  // Use key prop on img element instead of useEffect to avoid cascading renders
  // Key change forces React to remount component, resetting state naturally
  const normalizedRating: "s" | "q" | "e" = (post.rating === "q" || post.rating === "e") ? post.rating : "s";
  const shouldBlur = shouldBlurPost(normalizedRating, safeMode, panicMode);
  const effectiveBlur = getEffectiveBlurAmount(safeMode, panicMode, blurAmount);

  const isVideo = isVideoPost(post.fileUrl);

  const resetImageZoom = useCallback(() => {
    transformRef.current?.resetTransform();
  }, []);

  useEffect(() => {
    const handleMediaKeys = (e: KeyboardEvent) => {
      if (e.key === " ") {
        if (document.activeElement?.tagName === "VIDEO") {
          return;
        }
        e.preventDefault();
        setIsVideoPlaying((v) => !v);
        return;
      }

      if (e.key === ZOOM_RESET_KEY && !isVideo) {
        e.preventDefault();
        resetImageZoom();
      }
    };
    window.addEventListener("keydown", handleMediaKeys);
    return () => window.removeEventListener("keydown", handleMediaKeys);
  }, [isVideo, resetImageZoom]);

  useEffect(() => {
    if (!isVideo) {
      resetImageZoom();
    }
  }, [post.id, isVideo, resetImageZoom]);

  useEffect(() => {
    return () => {
      isImagePanningActive = false;
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) {
      return;
    }

    const clickedMedia = e.target.closest("img,video");
    if (!clickedMedia) {
      onBackgroundClick();
      return;
    }

    if (isVideo && !(e.target instanceof HTMLVideoElement)) {
      setIsVideoPlaying((v) => !v);
    }
  };

  return (
    <div
      className="flex relative justify-center items-center pb-20 w-full h-full cursor-default overflow-auto"
      onClick={handleContainerClick}
    >
      {isVideo ? (
        videoError ? (
          <div className="flex flex-col gap-4 justify-center items-center w-full h-full text-muted-foreground">
            <FileText className="w-16 h-16 opacity-50" />
            <div className="text-center">
              <p className="text-lg font-semibold">Failed to load video</p>
              <p className="text-sm">The video file could not be loaded.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setVideoError(false);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : (
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
              onError={() => {
                log.error("[ViewerMedia] Video load error:", post.fileUrl);
                setVideoError(true);
              }}
              ref={(el) => {
                if (el) {
                  if (isVideoPlaying && el.paused) el.play().catch(() => {});
                  else if (!isVideoPlaying && !el.paused) el.pause();
                }
              }}
            />
          </div>
        )
      ) : imageError ? (
        <div className="flex flex-col gap-4 justify-center items-center w-full h-full text-muted-foreground">
          <FileText className="w-16 h-16 opacity-50" />
          <div className="text-center">
            <p className="text-lg font-semibold">Failed to load image</p>
            <p className="text-sm">The image file could not be loaded.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setImageError(false);
                setHasTriedFallback(false); // Reset fallback flag on retry
                // Force reload by changing src (React will re-render img with new src)
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <TransformWrapper
          ref={transformRef}
          initialScale={IMAGE_MIN_SCALE}
          minScale={IMAGE_MIN_SCALE}
          maxScale={IMAGE_MAX_SCALE}
          wheel={{ step: IMAGE_WHEEL_STEP }}
          doubleClick={{ mode: "reset" }}
          onPanningStart={() => {
            isImagePanningActive = true;
          }}
          onPanningStop={() => {
            isImagePanningActive = false;
          }}
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            <img
              key={`${post.id}-${hasTriedFallback}`} // Force re-render when fallback changes, resets state on post change
              src={hasTriedFallback ? post.fileUrl : (post.sampleUrl || post.fileUrl)}
              alt={`Post ${post.id}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                log.error("[ViewerMedia] Image load error:", post.fileUrl);
                
                // CRITICAL: Use simple flag to prevent infinite loop
                // If both sampleUrl and fileUrl fail (404), we'd loop forever without this check
                // Simple useState flag is more reliable than URL comparison (which has overhead)
                if (!hasTriedFallback && post.fileUrl) {
                  // Try fileUrl as fallback (only once)
                  setHasTriedFallback(true);
                  e.currentTarget.src = post.fileUrl;
                } else {
                  // Both URLs failed or already tried - show error
                  setImageError(true);
                }
              }}
            />
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  );
};


const TagsDrawer = ({
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
  const setQuery = useSearchStore((state) => state.setQuery);

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
  const { data: resolvedArtistTags = [] } = useQuery<string[]>({
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
  const { data: resolvedCharacterTags = [] } = useQuery<string[]>({
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
  const { data: resolvedCopyrightTags = [] } = useQuery<string[]>({
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

  const handleTagClick = (tag: string) => {
    closeViewer(); // Close viewer first
    onOpenChange(false); // Close drawer
    setQuery(tag);
    navigate("/browse");
  };


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Post Metadata</SheetTitle>
          <SheetDesc>Post ID: {post.postId}</SheetDesc>
        </SheetHeader>
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
          {/* Copyright Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Copyright</h3>
            {copyrightTags.length > 0 ? (
              <div className="space-y-1">
                {copyrightTags.map((tag, index) => (
                  <button
                    key={`copyright-${tag}-${index}`}
                    onClick={() => handleTagClick(tag)}
                    className="block text-sm text-purple-600 hover:underline text-left"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No copyright detected
              </p>
            )}
          </div>
          {/* Character Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Character</h3>
            {characterTags.length > 0 ? (
              <div className="space-y-1">
                {characterTags.map((tag, index) => (
                  <button
                    key={`character-${tag}-${index}`}
                    onClick={() => handleTagClick(tag)}
                    className="block text-sm text-green-600 hover:underline text-left"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No character detected
              </p>
            )}
          </div>
          {/* Artist Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Artist</h3>
            {artistTags.length > 0 ? (
              <div className="space-y-1">
                {artistTags.map((tag, index) => (
                  <button
                    key={`artist-${tag}-${index}`}
                    onClick={() => handleTagClick(tag)}
                    className="block text-sm text-red-600 hover:underline text-left"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No artist detected
              </p>
            )}
          </div>
          {/* General Tags Section */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Tags ({generalTags.length})
            </h3>
            <div className="max-h-[400px] overflow-hidden rounded-md border">
              <Virtuoso
                style={{ height: "400px" }}
                data={generalTags}
                components={{
                  Header: undefined,
                }}
                itemContent={(_index, tag) => {
                  return (
                    <button
                      onClick={() => handleTagClick(tag)}
                      className="w-full px-3 py-2 text-sm text-left border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer text-foreground"
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
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  // Local state for randomization in viewer (not synced with global store)
  const isRandom = (queue && "isRandom" in queue) ? queue.isRandom ?? false : false;
  const setQueueIsRandom = useViewerStore((state) => state.setQueueIsRandom);

  const handleToggleRandom = useCallback(() => {
    const newIsRandom = !isRandom;
    setQueueIsRandom(newIsRandom);
  }, [isRandom, setQueueIsRandom]);

  const handleToggleFavorite = useCallback(async () => {
    await ctrl.toggleFavorite();
  }, [ctrl]);

  const handleMarkViewed = useCallback(async () => {
    if (post.isViewed) return;
    // Fire and forget: suppress rate limit errors
    window.api.markPostAsViewed(post.id).catch((err) => {
      // Ignore rate limit errors - use typed errorCode, NOT string parsing
      const errorCode = (err as { code?: string })?.code;
      if (errorCode === "RATE_LIMIT") {
        return; // Silently ignore rate limit errors
      }
      // Log other errors for debugging
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.error("[ViewerDialog] Failed to mark post as viewed:", errorMessage);
    });
  }, [post]);

  // Handle keyboard shortcuts with aria-live announcements
  const [announcement, setAnnouncement] = useState<string>("");
  
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
          // Announce action for screen readers and accessibility
          setAnnouncement(post.isFavorited ? "Removed from favorites" : "Added to favorites");
          setTimeout(() => setAnnouncement(""), 3000);
          break;
        case "v":
        case "V":
          e.preventDefault();
          handleMarkViewed();
          // Announce action for screen readers and accessibility
          setAnnouncement("Marked as viewed");
          setTimeout(() => setAnnouncement(""), 3000);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleFavorite, handleMarkViewed, post.isFavorited]);

  return (
    <>
      {/* Aria-live region for keyboard shortcut announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      <ViewerMedia post={post} onBackgroundClick={close} />

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
            variant={isRandom ? "default" : "ghost"}
            size="icon"
            onClick={handleToggleRandom}
            className={cn(
              "text-white rounded-full hover:bg-white/10",
              isRandom && "bg-primary hover:bg-primary/90"
            )}
            aria-label={isRandom ? "Disable randomization" : "Enable randomization"}
            title={isRandom ? "Randomization enabled (click to disable)" : "Randomization disabled (click to enable)"}
          >
            <Shuffle className={cn("w-5 h-5", isRandom && "fill-current")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistDialog(true);
            }}
            className="text-white rounded-full hover:bg-white/10"
            aria-label="Add to Playlist"
            title="Add to Playlist"
          >
            <Plus className="w-5 h-5" />
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
              className="w-56 shadow-lg bg-popover text-popover-foreground border-border"
              sideOffset={8}
              align="end"
            >
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy...
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-48 shadow-xl bg-popover text-popover-foreground border-border">
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
          "absolute left-2 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white transition-colors outline-none",
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
          "absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white transition-colors outline-none",
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

      {/* Playlist Dialog */}
      {showPlaylistDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70" onClick={() => setShowPlaylistDialog(false)}>
          <div className="bg-popover text-popover-foreground border border-border rounded-lg p-4 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <QuickAddToPlaylistMenu
              post={{ id: post.id, postId: post.postId }}
              trigger={
                <Button variant="outline" className="w-full mb-4">
                  <List className="mr-2 h-4 w-4" />
                  Select Playlists
                </Button>
              }
              onSuccess={() => setShowPlaylistDialog(false)}
            />
            <Button
              variant="ghost"
              onClick={() => setShowPlaylistDialog(false)}
              className="w-full mt-2"
            >
              Close
            </Button>
          </div>
        </div>
      )}
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

  // Get infiniteData for fallback lookup (for remote posts)
  // React Compiler: Use queue directly instead of queue?.origin to match inferred dependencies
  const infiniteData = useMemo(() => {
    if (!queue?.origin) return undefined;
    
    let queryKey: unknown[] = [];
    if (queue.origin.kind === "playlist") {
      // Match query key from PlaylistGallery: ["playlist-posts", playlistId, mediaType, sortOrder]
      queryKey = ["playlist-posts", queue.origin.playlistId, queue.origin.mediaType ?? "all", queue.origin.sortOrder ?? "desc"];
    } else if (queue.origin.kind === "artist") {
      const aiFilter = queue.origin.aiFilter ?? "all";
      const mediaType = queue.origin.mediaType ?? "all";
      queryKey = ["posts", queue.origin.artistId, aiFilter, mediaType];
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
      return undefined;
    }
    
    return queryClient.getQueryData<InfiniteData<Post[]>>(queryKey);
  }, [queue, queryClient]);

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
    // - Artist gallery: ["posts", artistId, aiFilter, mediaType]
    // - Favorites: ["posts", "favorites", tags] or ["posts", "favorites"]
    // - Updates: ["posts", "updates", tags] or ["posts", "updates"]
    // - Search: ["search", tags]
    // - Playlist: ["playlist-posts", playlistId, mediaType, sortOrder]
    let queryKey: unknown[] = [];
    if (queue.origin.kind === "artist") {
      const aiFilter = queue.origin.aiFilter ?? "all";
      const mediaType = queue.origin.mediaType ?? "all";
      queryKey = ["posts", queue.origin.artistId, aiFilter, mediaType];
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
    } else if (queue.origin.kind === "playlist") {
      // Match query key from PlaylistGallery: ["playlist-posts", playlistId, mediaType, sortOrder]
      queryKey = ["playlist-posts", queue.origin.playlistId, queue.origin.mediaType ?? "all", queue.origin.sortOrder ?? "desc"];
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
          if (isImagePanningActive) {
            return;
          }
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          if (isImagePanningActive) {
            return;
          }
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
            // Post not found in cache - try shadow insert for remote posts
            <PostNotFoundFallback
              currentPostId={currentPostId}
              queue={queue}
              infiniteData={infiniteData}
              onPostFound={(foundPost) => (
                <ViewerContent
                  key={foundPost.id}
                  post={foundPost}
                  queue={queue}
                  close={close}
                  next={next}
                  prev={prev}
                  controlsVisible={controlsVisible}
                  toggleTagsDrawer={toggleTagsDrawer}
                  isTagsDrawerOpen={isTagsDrawerOpen}
                />
              )}
              onClose={close}
            />
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
