# Lessons Learned

## React Hooks Rules Violations

### Problem
React Hooks must be called in the same order on every render. Calling hooks conditionally or inside JSX causes "Rendered more hooks than during the previous render" errors.

### Solution
- **Always call hooks at the top level** of the component, never inside:
  - Conditional statements
  - Loops
  - JSX expressions
  - Event handlers

### Example (WRONG):
```tsx
<VirtuosoGrid
  endReached={useCallback(() => { ... }, [deps])}  // ❌ Hook inside JSX
/>
```

### Example (CORRECT):
```tsx
const handleEndReached = useCallback(() => { ... }, [deps]);  // ✅ Hook at top level

<VirtuosoGrid
  endReached={handleEndReached}
/>
```

---

## Filter State Management

### Problem
Changing filter structure (e.g., `hideAiGenerated: boolean` → `aiFilter: "all" | "hide" | "only"`) requires updating all components that use the filter.

### Solution
- **Update store interface first** with new filter types
- **Update default filters** to match new structure
- **Update all components** that read/write filters:
  - Browse.tsx
  - Updates.tsx
  - Favorites.tsx
  - ArtistGallery.tsx
  - FiltersPanel.tsx

### Migration Pattern:
```tsx
// Old
filters.hideAiGenerated  // boolean

// New
filters.aiFilter  // "all" | "hide" | "only"

// Update logic
if (filters.aiFilter === "hide") {
  posts = posts.filter(post => !hasAiGeneratedTag(post.tags));
} else if (filters.aiFilter === "only") {
  posts = posts.filter(post => hasAiGeneratedTag(post.tags));
}
```

---

## JSX Conditional Rendering Structure

### Problem
Complex nested ternary operators can cause syntax errors if brackets don't match correctly.

### Solution
- Use consistent indentation
- Match opening `{` with closing `}`
- Each ternary branch should be properly closed with `)`
- Final closing `}` should match the opening `{` of the JSX expression

### Example (CORRECT):
```tsx
{condition1 ? (
  <Component1 />
) : condition2 ? (
  <Component2 />
) : (
  <Component3 />
)}
```

### Common Mistakes:
- Extra `)}` at the end (should be just `}`)
- Missing `)` after a branch
- Mismatched brackets in nested ternaries

---

## Component Reusability

### Problem
When applying the same layout logic (Grid/Masonry) to multiple tabs, duplicating code leads to maintenance issues.

### Solution
- Create **factory functions** for components that depend on `viewType`
- Use `useMemo` to create components dynamically based on state
- Share the same pattern across all tabs

### Pattern:
```tsx
// Factory functions
const createVirtuosoList = (viewType: "grid" | "masonry") => forwardRef(...);
const createItemContainer = (viewType: "grid" | "masonry") => forwardRef(...);

// In component
const { ListComponent, ItemComponent } = useMemo(() => {
  const VirtuosoList = createVirtuosoList(viewType);
  const Item = createItemContainer(viewType);
  return { ListComponent: VirtuosoList, ItemComponent: Item };
}, [viewType]);
```

---

---

## Debouncing and Rate Limiting

### Problem
Rapid scroll events trigger too many API calls, causing rate limit errors.

### Solution
- Use `setTimeout` with debounce delay (150-200ms)
- Clear pending timeouts in cleanup
- Use `useRef` to store timeout IDs
- Implement exponential backoff for retries

### Example:
```tsx
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleEndReached = useCallback(() => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  
  timeoutRef.current = setTimeout(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    timeoutRef.current = null;
  }, 150);
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

---

## React Strict Mode Double Rendering

### Problem
React Strict Mode causes `useEffect` to run twice in development, leading to duplicate API calls and rate limit errors.

### Solution
- Use `useRef` flags to prevent duplicate execution
- Check flag before making API calls
- Set flag immediately to prevent second execution

### Example:
```tsx
const hasCheckedRef = useRef(false);

useEffect(() => {
  if (hasCheckedRef.current) return;
  hasCheckedRef.current = true;
  
  // Make API call
  fetchData();
}, []);
```

---

## Professional UI Density and Spacing

### Problem
Desktop applications require proper spacing and density to feel professional. Too narrow panels cause text truncation, too wide waste space.

### Solution
- **Use "Golden Mean" width for side panels**: `w-80` (320px) is the standard for desktop popovers/sidebars
- **Remove truncate when space allows**: Full text visibility improves UX
- **Standardize icon sizes**: `w-3.5 h-3.5` for readable icons in filter panels
- **Use proper gap spacing**: `gap-2` (8px) between icon and text for better visual scanability
- **Equal distribution with flex-1**: All items in a toggle group should have `flex-1` for equal width distribution

### Example:
```tsx
// Container width
<PopoverContent className="w-80" align="end">  // ✅ 320px standard

// ToggleGroup with equal distribution
<ToggleGroup className="w-full">
  <ToggleGroupItem className="flex-1 gap-2">  // ✅ Equal width, proper gap
    <Icon className="w-3.5 h-3.5 shrink-0" />  // ✅ Readable size
    <span className="text-xs">Full Text</span>  // ✅ No truncate
  </ToggleGroupItem>
</ToggleGroup>
```

### Padding Standards:
- `sm`: `px-3` (12px) - comfortable padding for filter buttons
- `default`: `px-3` (12px)
- `lg`: `px-4` (16px)

---

## Visual Polish for Professional UI

### Problem
Disabled options and section headers need clear visual hierarchy and user feedback.

### Solution
- **Section headers**: Use `text-[10px] uppercase` with `opacity-50` for subtle, native-app feel
- **Disabled items**: Add `cursor-not-allowed` and `title` attribute for tooltips
- **Consistent opacity**: Use `opacity-50` for disabled states (not just muted colors)

### Example:
```tsx
// Section header
<label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 opacity-50">
  {label}
</label>

// Disabled option with tooltip
<ToggleGroupItem
  disabled={true}
  className="opacity-50 cursor-not-allowed"
  title="Coming soon"  // ✅ Native tooltip
>
  {label}
</ToggleGroupItem>
```

---

## Component Width Management

### Problem
Toggle groups and flex containers need proper width management to prevent squishing and ensure equal distribution.

### Solution
- **Always add `w-full` to ToggleGroup container**: Ensures full width usage
- **Use `flex-1` on all items**: Equal distribution across available space
- **Remove `min-w-0` when not needed**: Only use when truncate is required
- **Use `shrink-0` on icons**: Prevents icons from being compressed

### Example:
```tsx
<ToggleGroup className="w-full">  // ✅ Full width
  <ToggleGroupItem className="flex-1 gap-2">  // ✅ Equal distribution
    <Icon className="w-3.5 h-3.5 shrink-0" />  // ✅ Icon won't shrink
    <span className="text-xs">Text</span>  // ✅ Text can wrap if needed
  </ToggleGroupItem>
</ToggleGroup>
```

---

## Reusable Hooks for Common Patterns

### Problem
Multiple components (Browse, ArtistGallery, Updates, Favorites) use the same infinite scroll logic with `useInfiniteQuery`, leading to code duplication.

### Solution
- **Extract common logic into a reusable hook** (`useGalleryInfiniteScroll`)
- **Support custom `getNextPageParam`** for different data sources (external API vs local DB)
- **Include debounce logic** in the hook to prevent rate limiting
- **Return flattened data** (`allPosts`) for convenience

### Example:
```tsx
// Hook definition
export function useGalleryInfiniteScroll<TPost>({
  queryKey,
  fetchFn,
  getNextPageParam, // Optional custom logic
  ...
}) {
  const { data, fetchNextPage, hasNextPage, ... } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => await fetchFn(pageParam),
    getNextPageParam: getNextPageParam || defaultLogic,
    ...
  });
  
  const handleEndReached = useCallback(() => {
    // Debounce logic here
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return { data, allPosts, fetchNextPage, hasNextPage, handleEndReached, ... };
}

// Usage in component
const { allPosts: rawPosts, handleEndReached, ... } = useGalleryInfiniteScroll({
  queryKey: ["search", tags],
  fetchFn: async (pageParam) => await window.api.searchBooru({ tags, page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.length > 0 ? allPages.length + 1 : undefined,
});
```

---

## Pagination Logic: External API vs Local DB

### Problem
Different data sources require different pagination strategies:
- **Local DB**: We know total count, can stop when page has fewer items than limit
- **External API**: We don't know total count, must load until empty array

### Solution
- **Local DB (Artists)**: Use default logic - stop if `lastPage.length < postsPerPage`
- **External API (Browse)**: Use custom logic - continue until `lastPage.length === 0`

### Example:
```tsx
// Local DB - knows total count
getNextPageParam: (lastPage, allPages) => {
  return lastPage.length === 50 ? allPages.length + 1 : undefined;
}

// External API - doesn't know total count
getNextPageParam: (lastPage, allPages) => {
  if (lastPage.length === 0) return undefined; // No more posts
  return allPages.length + 1; // Continue loading
}
```

### Key Insight:
External APIs may return fewer posts than the limit but still have more pages. Only an empty array indicates no more data.

---

## Masonry Layout with Flexbox

### Problem
CSS `columns` layout doesn't work well with virtualization and has limitations for responsive design.

### Solution
- **Use flexbox** (`flex flex-wrap`) instead of CSS columns
- **Responsive widths** using Tailwind arbitrary values: `w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)]`
- **Natural aspect ratios** for masonry - remove fixed `aspect-ratio` on PostCard
- **IntersectionObserver** for infinite scroll trigger (not VirtuosoGrid)

### Example:
```tsx
// Masonry container
<div className="flex flex-wrap gap-4 justify-center p-4">
  {posts.map((post) => (
    <div 
      key={post.id}
      className="flex-shrink-0 w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)]"
    >
      <PostCard post={post} />
    </div>
  ))}
  <div ref={masonryTriggerRef} className="h-10 w-full" />
</div>
```

---

## PostCard ViewType Adaptation

### Problem
PostCard needs different styling for Grid vs Masonry layouts:
- **Grid**: Fixed aspect ratio, `object-cover` to fill container
- **Masonry**: Natural aspect ratio, variable heights

### Solution
- **Get `viewType` from store** inside PostCard component
- **Conditional classes** based on `viewType`
- **Grid**: `aspect-[3/4]` on container, `h-full object-cover` on image
- **Masonry**: No aspect ratio on container, `h-auto` on image

### Example:
```tsx
const viewType = useSearchStore((state) => state.viewType);

<button className={cn(
  "w-full overflow-hidden",
  viewType === "grid" ? "aspect-[3/4]" : ""
)}>
  <img className={cn(
    "w-full",
    viewType === "grid" 
      ? "h-full object-cover" 
      : "h-auto"
  )} />
</button>
```

---

## VirtuosoGrid totalCount: Filtered vs Raw Data

### Problem
Using `rawPosts.length` for `totalCount` but rendering `allPosts[index]` creates empty holes in virtualization. If you have 1000 raw posts but filters leave only 10, Virtuoso creates a scrollbar for 1000 items, with 990 empty holes.

### Solution
- **Always use `allPosts.length` for `totalCount`** - matches the actual rendered items
- **Keep `endReached` logic on `rawPosts`** - we want to load more data even when filters hide posts
- The `itemContent` callback receives indices from 0 to `totalCount-1`, so `totalCount` must match filtered data

### Example (WRONG):
```tsx
const rawPosts = useMemo(() => data?.pages.flat() || [], [data]);
const allPosts = useMemo(() => rawPosts.filter(...), [rawPosts, filters]);

<VirtuosoGrid
  totalCount={rawPosts.length}  // ❌ 1000 items
  itemContent={(index) => allPosts[index]}  // ❌ Only 10 valid = 990 empty holes
/>
```

### Example (CORRECT):
```tsx
const rawPosts = useMemo(() => data?.pages.flat() || [], [data]);
const allPosts = useMemo(() => rawPosts.filter(...), [rawPosts, filters]);

<VirtuosoGrid
  totalCount={allPosts.length}  // ✅ 10 items = no empty holes
  itemContent={(index) => allPosts[index]}  // ✅ All indices valid
  endReached={handleEndReached}  // ✅ Still works on rawPosts for loading
/>
```

### Key Insight:
- `totalCount` = number of items to render (filtered)
- `endReached` = logic for loading more data (raw/unfiltered)
- These serve different purposes and can use different data sources

---

## Memory Leaks: Cleanup Timeouts in useEffect

### Problem
`setTimeout` in retry logic not cleaned up causes memory leaks. If component unmounts during retry delay, the timeout fires and tries to update state of a dead component.

### Solution
- **Always store timeout ID** in a variable
- **Return cleanup function** from `useEffect` to clear timeout
- **Check if timeout exists** before clearing

### Example (WRONG):
```tsx
useEffect(() => {
  const checkStatus = async () => {
    try { ... }
    catch (error) {
      if (isRateLimit && retryCountRef.current < MAX_RETRIES) {
        setTimeout(() => { checkStatus(); }, delay);  // ❌ No cleanup
      }
    }
  };
  checkStatus();
}, []);
```

### Example (CORRECT):
```tsx
useEffect(() => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const checkStatus = async () => {
    try { ... }
    catch (error) {
      if (isRateLimit && retryCountRef.current < MAX_RETRIES) {
        timeoutId = setTimeout(() => { checkStatus(); }, delay);  // ✅ Store ID
      }
    }
  };
  
  checkStatus();
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);  // ✅ Cleanup
    }
  };
}, []);
```

### Key Insight:
Any async operation started in `useEffect` must be cancellable. Timeouts, intervals, and promises should all have cleanup paths.

---

## Infinite Loop Prevention in Error Handlers

### Problem
In `onError` handlers, setting `img.src = post.fileUrl` can create infinite loops if `fileUrl` is also broken (404 or invalid protocol). The error handler fires again, tries the same URL, fires again, etc.

### Solution
- **Use `includes()` instead of `!==`** to handle query parameters
- **Track attempted URLs** to prevent retrying the same URL
- **Set error state** after exhausting fallbacks

### Example (WRONG):
```tsx
onError={(e) => {
  const img = e.currentTarget;
  if (img.src !== post.fileUrl && post.fileUrl) {
    img.src = post.fileUrl;  // ❌ If fileUrl also fails, infinite loop
  }
}}
```

### Example (CORRECT):
```tsx
onError={(e) => {
  const img = e.currentTarget;
  // Use includes() to handle query parameters and prevent loop
  if (post.fileUrl && !img.src.includes(post.fileUrl)) {
    img.src = post.fileUrl;  // ✅ Try fallback once
  } else {
    setImageError(true);  // ✅ Stop retrying, show error
  }
}}
```

### Key Insight:
Error handlers must have a termination condition. Always check if you've already tried the fallback before retrying.

---

## URL Parsing: Handling Query Parameters

### Problem
Using `endsWith('.mp4')` breaks with query parameters like `?token=...` or `?v=1`. The check fails even for valid video URLs.

### Solution
- **Parse URL using `URL` API** to extract pathname
- **Use regex on pathname** instead of entire URL string
- **Handle relative paths** with fallback regex
- **Case-insensitive matching** with `/i` flag

### Example (WRONG):
```tsx
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  return fileUrl.endsWith(".mp4") || fileUrl.endsWith(".webm");  // ❌ Breaks with ?token=abc
}
```

### Example (CORRECT):
```tsx
export function isVideoPost(fileUrl: string | undefined | null): boolean {
  if (!fileUrl) return false;
  
  try {
    // Parse URL to handle query parameters
    const url = new URL(fileUrl);
    const path = url.pathname;
    return /\.(mp4|webm|mov)$/i.test(path);  // ✅ Works with query params
  } catch {
    // Fallback for relative paths or invalid URLs
    const pathMatch = fileUrl.match(/^[^?#]+/);
    const path = pathMatch ? pathMatch[0] : fileUrl;
    return /\.(mp4|webm|mov)$/i.test(path);  // ✅ Handles relative paths
  }
}
```

### Benefits:
- ✅ Handles query parameters: `video.mp4?token=abc`
- ✅ Handles hash fragments: `video.mp4#section`
- ✅ Case-insensitive: `.MP4`, `.mp4` both work
- ✅ Handles relative paths: `/path/to/video.mp4`
- ✅ Graceful fallback for invalid URLs

---

## Type Safety: Avoid `any` in Tests

### Problem
Using `any` in tests reduces type safety and can hide real bugs. Tests should catch type errors, not ignore them.

### Solution
- **Use proper types** even for mocks
- **Use `Partial<T>` for partial mocks**
- **Type intersection** for extended mock objects
- **Use `| null` for nullable types**

### Example (WRONG):
```tsx
let mockObserver: any;  // ❌ No type safety
let observer: any = null;  // ❌ Hides type errors
```

### Example (CORRECT):
```tsx
let mockObserver: Partial<IntersectionObserver> & {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  options?: IntersectionObserverInit;
  callback?: IntersectionObserverCallback;
};  // ✅ Properly typed

let observer: IntersectionObserver | null = null;  // ✅ Explicit nullable type
```

### Key Insight:
Tests are code too. They should follow the same type safety standards as production code. `any` defeats the purpose of TypeScript.

---

## TypeScript: Remove Unused Variables

### Problem
Unused imports and variables clutter code and can cause confusion. TypeScript's `--noEmit` mode flags these as errors.

### Solution
- **Run `npm run typecheck` regularly** to catch unused code
- **Remove unused imports** immediately
- **Remove unused variables** from destructuring
- **Remove unused computed values** (like `useMemo` that's never read)

### Common Patterns:
```tsx
// ❌ Unused import
import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

// ❌ Unused variable from destructuring
const { data, allPosts, ... } = useGalleryInfiniteScroll(...);

// ❌ Unused computed value
const hasActiveFilters = useMemo(() => { ... }, [filters]);
```

### Fix:
```tsx
// ✅ Remove unused import
// import { EXTERNAL_ARTIST_ID } from "../../../shared/constants";

// ✅ Remove unused from destructuring
const { allPosts, ... } = useGalleryInfiniteScroll(...);

// ✅ Remove unused variable
// const hasActiveFilters = useMemo(() => { ... }, [filters]);
```

### Key Insight:
Clean code is maintainable code. Unused variables indicate incomplete refactoring or dead code that should be removed.

---

## Key Takeaways

1. **Always follow Rules of Hooks** - hooks at top level, same order
2. **totalCount must match filtered data** - use `allPosts.length` not `rawPosts.length` for VirtuosoGrid
3. **endReached works on raw data** - load more data even when filters hide posts
4. **Update all consumers when changing store structure** - don't miss any components
5. **Handle errors gracefully** - provide fallbacks and user feedback, prevent infinite loops
6. **Debounce expensive operations** - prevent rate limiting
7. **Use refs to prevent double execution** - especially in Strict Mode
8. **Match JSX brackets carefully** - syntax errors are hard to debug
9. **Create reusable patterns** - factory functions for dynamic components
10. **Test with filters active** - edge cases often appear with filtered data
11. **Use standard desktop widths** - `w-80` (320px) for side panels/popovers
12. **Prioritize text visibility** - remove truncate when space allows
13. **Standardize spacing** - `gap-2` for icon-text, `px-3` for sm buttons
14. **Add tooltips for disabled items** - improve UX with native `title` attribute
15. **Use opacity-50 for headers** - creates subtle, professional hierarchy
16. **Extract common logic into hooks** - reduce duplication, improve maintainability
17. **Different pagination strategies** - external API vs local DB require different logic
18. **Flexbox for masonry** - more flexible than CSS columns, better responsive support
19. **Adapt components to viewType** - conditional styling based on layout mode
20. **Continue loading until empty** - for external APIs without total count
21. **Always cleanup timeouts** - prevent memory leaks with `clearTimeout` in useEffect cleanup
22. **Prevent infinite loops in error handlers** - use `includes()` instead of `!==`, check if fallback already tried
23. **Parse URLs properly** - use `URL` API for query parameters, not `endsWith()`
24. **Type safety in tests** - avoid `any`, use proper types even for mocks
25. **Remove unused code** - run typecheck regularly, clean up unused imports and variables
