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

## Infinite Scroll with Filters

### Problem
When filters reduce the visible post count, `totalCount` based on filtered posts prevents infinite scroll from working correctly.

### Solution
- Use **raw (unfiltered) data length** for `totalCount` in VirtuosoGrid
- Always check `hasNextPage` based on raw data, not filtered
- Use `increaseViewportBy` prop to preload items

### Example:
```tsx
const rawPosts = useMemo(() => {
  return data?.pages.flatMap((page) => page) || [];
}, [data]);

const allPosts = useMemo(() => {
  // Apply filters to rawPosts
  return filteredPosts;
}, [rawPosts, filters]);

<VirtuosoGrid
  totalCount={rawPosts.length}  // ✅ Use raw data length
  endReached={handleEndReached}
  increaseViewportBy={2000}
/>
```

---

## Masonry Layout with Virtualization

### Problem
CSS `columns` layout doesn't work well with `react-virtuoso`'s `VirtuosoGrid` because virtualization requires fixed item positions, but masonry columns dynamically rearrange items.

### Solution
- **Disable virtualization for masonry layout**
- Use plain CSS columns with `IntersectionObserver` for infinite scroll
- Keep virtualization only for grid layout

### Example:
```tsx
{viewType === "masonry" ? (
  <div className="h-full overflow-auto">
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {allPosts.map((post, index) => (
        <div key={post.id} className="mb-4 break-inside-avoid">
          <PostCard post={post} onClick={() => handlePostClick(index)} />
        </div>
      ))}
    </div>
    <div ref={masonryTriggerRef} className="h-10" />
  </div>
) : (
  <VirtuosoGrid ... />  // ✅ Use virtualization for grid
)}
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

## Error Handling in Image Loading

### Problem
Failed image/video loads show black screens with no user feedback.

### Solution
- Add `onError` handlers to `<img>` and `<video>` tags
- Implement fallback URLs (e.g., `sampleUrl` → `fileUrl`)
- Show error UI with retry option
- Log errors for debugging

### Example:
```tsx
const [imageError, setImageError] = useState(false);

<img
  src={post.sampleUrl || post.fileUrl}
  onError={(e) => {
    const img = e.currentTarget;
    if (img.src !== post.fileUrl && post.fileUrl) {
      img.src = post.fileUrl;  // Try fallback
    } else {
      setImageError(true);  // Show error UI
    }
  }}
/>
```

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

## Key Takeaways

1. **Always follow Rules of Hooks** - hooks at top level, same order
2. **Use raw data for infinite scroll calculations** - filters should only affect display
3. **Masonry and virtualization don't mix** - choose one approach
4. **Update all consumers when changing store structure** - don't miss any components
5. **Handle errors gracefully** - provide fallbacks and user feedback
6. **Debounce expensive operations** - prevent rate limiting
7. **Use refs to prevent double execution** - especially in Strict Mode
8. **Match JSX brackets carefully** - syntax errors are hard to debug
9. **Create reusable patterns** - factory functions for dynamic components
10. **Test with filters active** - edge cases often appear with filtered data
