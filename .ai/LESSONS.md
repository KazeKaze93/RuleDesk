# Security & Architecture Lessons

## 🚨 Critical Security Issues

### 1. Data Leakage Through Logs (Security Leak)

**Problem**: Forwarding ALL Main process logs to Renderer via IPC (`log:main-log`).

**Why it's dangerous**:

- Main process logs may contain: file paths, tokens, decrypted API keys, system information
- Renderer is by definition an untrusted environment
- Sensitive data could be exposed to malicious code in renderer

**Fix**:

- Remove log forwarding from Main to Renderer
- Use DevTools or specialized log files for debugging
- Never transmit system logs to UI

### 2. XML Parsing with Regex (Fragile & Insecure)

**Problem**: Using regular expressions to parse XML/HTML is fragile and insecure.

**Why it's dangerous**:

- ReDoS attacks possible
- Breaks if attributes change order
- Fragile and error-prone
- Control characters in regex trigger ESLint errors (`no-control-regex`)

**Fix**:

- **For structured XML**: Use `fast-xml-parser` or similar library
- **For simple attribute extraction**: Use `charCodeAt` filtering instead of regex (see Control Character Fix)
- Force API to return only JSON if possible
- Never parse XML/HTML with regex patterns containing control characters

### 3. Mixing require and import

**Problem**: Using `require("../../db/client")` in TypeScript/ES modules.

**Why it's bad**:

- Breaks dependency tree
- Looks like a hack from 2015
- Inconsistent with modern TypeScript/ES modules

**Fix**:

- Use proper `import` statements
- Use DI container if needed (already exists)

## ⚠️ Important Issues to Fix

### 4. Main Process Blocking in resolveTags

**Problem**: Running `Promise.allSettled` with network requests directly in controller.

**Why it's bad**:

- Can block IPC channel if many tags and slow network
- Fills connection pool
- Can cause UI freezes

**Fix**:

- Move heavy logic to Utility Process
- Or at least limit concurrency (attempted with CONCURRENCY_LIMIT, but 5 parallel fetches in Main process is still load on event loop)

### 5. N+1 Problem in ArtistCard

**Problem**: Calling `useQuery` for posts count for EACH artist card.

**Why it's bad**:

- 100 artists = 100 IPC calls + 100 DB queries on page render
- Massive performance hit

**Fix**:

- Use JOIN in main `getTrackedArtists` query
- Or use `sql.raw` to get count in single query
- Return `postsCount` as part of artist object

### 6. Workaround in searchStore.ts (Log Injection?)

**Problem**: `logPatterns` in `setQuery` is a symptom, not a cure.

**Why it's bad**:

- Indicates fundamental architectural error
- Why are logs even reaching search input?
- This "protection" looks ridiculous

**Fix**:

- Find where log events are leaking into search state
- Fix root cause instead of treating symptoms with regex

## 💡 Recommendations

### 7. Drizzle Type Safety

**Problem**: Using unsafe type casting (`as`) for Drizzle query results.

**Why it's bad**:
- Manual casts bypass TypeScript's type checking
- Can hide runtime errors
- Makes code less maintainable

**Fix**:
- Drizzle allows typed queries via `db.run` or `db.all`
- Avoid `any` and manual `as` casts
- Use generic types: `sqlite.prepare<[], { name: string }>()`
- Let Drizzle infer types from schema definitions
- **Rule**: Fix types upstream instead of casting downstream

### 8. Zustand Selectors (Performance)

**Problem**: Using destructuring `const { query } = useSearchStore()` causes unnecessary re-renders.

**Why it's bad**:
- Causes re-render on ANY state change in store (not just `query`)
- Performance anti-pattern - breaks React optimization
- Can cause UI freezes with frequent state updates

**Fix**:
- **Always use selectors**: `const query = useSearchStore((state) => state.query)`
- Selector function ensures component only re-renders when selected value changes
- Apply everywhere: Favorites.tsx, Updates.tsx, Browse.tsx, etc.
- **Rule**: Never destructure from Zustand store - always use selector function

### 9. Optimize resolveTags

**Problem**: Hitting API one tag at a time in loop (even with limit of 5).

**Fix**:

- Check Rule34 API docs for batching support
- Some endpoints support tag lists or masks
- Reduce API calls significantly

## Recent Architecture Improvements

### 10. XML Fallback for Rule34 API

**Problem**: Rule34 API returns empty string for certain queries (like `user:tag`), causing search to fail silently. JSON endpoint fails but XML endpoint works.

**Solution**:
- Implemented strict XML fallback mechanism in `Rule34Provider.fetchPosts`
- When JSON API returns empty string or fails, automatically retry with `json=0` (XML mode)
- Created `parsePostXml` method using `fast-xml-parser` (replaced regex-based parsing)
- Direct mapping to `BooruPost` format ensures UI compatibility

**Key Implementation**:
- Try JSON first, catch errors and retry with XML
- Parse XML using `fast-xml-parser` with `attributeNamePrefix: ""` for direct attribute access (no "@_" prefix)
- **CRITICAL**: Normalize parser output - single post becomes `[post]`, array stays array
- Use `??` instead of `||` for attribute extraction (to preserve `0` and empty strings)
- Map attributes directly to camelCase `BooruPost` format
- Use `selectBestPreview` for previewUrl with fallback to fileUrl
- **XMLParser as class field**: Create parser once as `readonly` field, not on each call

### 11. Smart Search Fallback

**Problem**: Searching for uploader names (like "nsfwsfmx") returns 0 results because API searches for tags, not users.

**Solution**:
- Implemented fallback logic in `SearchController.search`:
  1. Primary search with original tags
  2. If 0 results and single word: try autocomplete for suggestions
  3. If still 0: retry with `user:` prefix (uploader search)
- Uses `provider.formatTag(originalTag, "uploader")` for consistency with SyncService

### 12. ViewerDialog Tag Categorization

**Problem**: Tags displayed in single list without categorization.

**Solution**:
- Added separate sections for Copyright (type=3), Character (type=4), Artist (type=1), and General (type=0)
- Each category displays multiple tags with color coding:
  - Copyright: purple (`text-purple-600`)
  - Character: green (`text-green-600`)
  - Artist: red (`text-red-600`)
  - General: default color
- Removed "Rating" field as requested
- Added IPC handlers for resolving tags by type

### 13. UX Improvement: External Link Button

**Problem**: When API returns 0 results, user has no way to check if tag exists on website.

**Solution**:
- Added informative block in Browse.tsx when search returns 0 results with tags
- Shows message: "API returned no results. This tag likely exists on the website but is not yet available in the API."
- Button: "Open {tag} on Rule34.xxx" opens browser with direct link to website search
- Uses `window.api.openExternal` for secure URL opening

### 14. Control Character Handling (ESLint Compliance)

**Problem**: ESLint error: `no-control-regex` - control characters in regex pattern are not allowed.

**Why it's bad**:
- Regex patterns with control characters (`\x00-\x1F`) trigger linting errors
- Security best practice: avoid control characters in regex

**Solution**:
- Replaced regex-based filtering with `charCodeAt` approach
- Filter characters by code point instead of regex pattern
- Allows common whitespace (tab, newline, carriage return) while removing control characters
- Use `charCodeAt(0)` to check character codes: `(code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13`

### 15. Tag Normalization Inconsistency

**Problem**: Inconsistent tag normalization between SearchController and SyncService caused case-sensitivity issues.

**Why it's bad**:
- SearchController used manual normalization: `tag.replace(/\s+/g, '_')` (only spaces → underscores)
- SyncService used `provider.formatTag()` (lowercase + spaces → underscores)
- Browse couldn't find posts with uppercase letters, even though they exist in DB via Tracked Artists
- Manual normalization missing `.toLowerCase()` conversion

**Solution**:
- **Always use `provider.formatTag(tag, type)` for tag normalization**
- Replaced manual normalization with `provider.formatTag(tag, "tag")` in SearchController
- Now Browse and Tracked Artists use identical tag normalization
- Ensures case-insensitive tag matching across the application
- **Rule**: Never manually normalize tags - always use provider's formatTag method

### 16. fast-xml-parser Structure Normalization

**Problem**: `fast-xml-parser` returns different structures depending on XML content - single object for one element, array for multiple. This caused posts to disappear in Tracked Artists when XML fallback was used.

**Why it's bad**:
- Parser returns `{ post: {...} }` for single post, `{ post: [{...}, {...}] }` for multiple
- Using `parsed.posts?.post || []` fails when `post` is an object (not array)
- Results in empty array, causing posts to not be saved to database
- Silent failure - no error, just missing data

**Solution**:
- **Always normalize parser output**: `Array.isArray(postsArray) ? postsArray : [postsArray]`
- Explicitly check for `parsed.posts` and `parsed.post` separately
- Handle `null`/`undefined` cases explicitly: `postsArray ? normalize : []`
- Use `??` instead of `||` for attribute extraction (preserves `0` and empty strings)
- **Rule**: When using XML parsers, always normalize single-element results to arrays

### 17. API Request Headers Standardization

**Problem**: Inconsistent headers across API requests can cause API blocking or rate limiting.

**Why it's bad**:
- Different User-Agent strings in different requests look suspicious
- Missing standard headers (Accept, Connection) may trigger API restrictions
- Duplicated header configuration code leads to inconsistencies

**Solution**:
- **Create single `getHeaders()` method** that returns standard headers for all requests
- Include: User-Agent (with fallback), Accept, Accept-Encoding, Connection
- Use `this.getHeaders()` in all axios requests (checkAuth, searchTags, fetchPosts)
- **Rule**: Always use centralized header method for API requests to prevent blocking

### 18. Rule34 API Pagination (0-based)

**Problem**: Rule34 API uses 0-based pagination for `pid` parameter, but UI typically uses 1-based page numbers.

**Why it's bad**:
- Sending `pid=1` when UI requests page 1 causes API to skip first page
- Results in missing posts and incorrect pagination
- Silent bug - no error, just wrong data

**Solution**:
- **Convert 1-based UI pages to 0-based API pid**: `const pid = options.page > 0 ? options.page - 1 : 0;`
- Document pagination logic in comments
- **Rule**: Always check API documentation for pagination format (0-based vs 1-based) and convert accordingly

### 19. XMLParser Configuration for Rule34

**Problem**: Using `attributeNamePrefix: "@_"` requires accessing attributes as `item["@_id"]`, which is verbose and error-prone.

**Why it's bad**:
- Verbose attribute access: `item["@_id"]` instead of `item.id`
- Easy to forget prefix, causing undefined values
- Inconsistent with Rule34 XML structure (all data in attributes)

**Solution**:
- **Use `attributeNamePrefix: ""`** for direct attribute access
- Access attributes directly: `post.id`, `post.file_url` (no prefix needed)
- Create parser as `readonly` class field, not on each method call
- **Rule**: For APIs that store all data in attributes, use empty prefix for cleaner code

### 20. React Query Cache Reactivity (useQuery vs getQueryData)

**Problem**: Using `queryClient.getQueryData()` inside `useMemo` is not reactive. When cache data changes (e.g., post marked as viewed), component doesn't re-render.

**Why it's bad**:
- `getQueryData` is a one-time read - it doesn't subscribe to cache updates
- Component won't reflect changes made to cache by other parts of the app
- Silent UI bugs - data updates but UI doesn't

**Solution**:
- **Use `useQuery` with `enabled: false` and `initialData`** for reactive cache access
- `useQuery` subscribes to cache updates even when `enabled: false`
- Set `initialData` from cache to populate initial value
- Set `staleTime: Infinity` and `gcTime: Infinity` to prevent refetching
- **Rule**: Never use `getQueryData` in render logic - always use `useQuery` for reactive cache access

### 21. Provider Abstraction Violation

**Problem**: Controller directly accessing provider URLs (e.g., `https://rule34.xxx/autocomplete.php`) instead of using provider abstraction.

**Why it's bad**:
- Violates separation of concerns - controller shouldn't know provider internals
- Makes code harder to maintain if provider changes
- Duplicates logic that already exists in provider
- Breaks abstraction layer

**Solution**:
- **Always use provider methods** (e.g., `provider.searchTags()`) instead of direct URL access
- Controller should only know about provider interface, not implementation details
- Move all URL construction and API-specific logic to provider
- **Rule**: Controllers must use provider abstraction, never access provider URLs directly

### 22. Magic Numbers for Tag Types

**Problem**: Using integer literals (0, 1, 3, 4, 5) for tag types without constants makes code unreadable and error-prone.

**Why it's bad**:
- Hard to understand what `type === 3` means without context
- Easy to make mistakes (typo in number)
- No type safety - compiler can't catch invalid values
- Makes refactoring difficult

**Solution**:
- **Create constants object** for all tag types:
  ```typescript
  export const TAG_TYPES = {
    GENERAL: 0,
    ARTIST: 1,
    COPYRIGHT: 3,
    CHARACTER: 4,
    META: 5,
  } as const;
  ```
- Use constants everywhere instead of magic numbers
- Export `TagType` type for type safety
- **Rule**: Never use magic numbers for enums or type identifiers - always use named constants

### 23. N+1 Query Anti-pattern (Residual)

**Problem**: Even after fixing N+1 with JOIN query, residual `useQuery` calls remain in components "just in case" data is missing.

**Why it's bad**:
- Creates unnecessary IPC calls and DB queries
- Indicates lack of trust in schema/API contract
- Performance overhead for no benefit
- Code complexity increases

**Solution**:
- **Trust the schema** - if JOIN query returns `postsCount`, use it directly
- Remove all fallback `useQuery` calls when data is guaranteed from parent query
- If data might be missing, fix the parent query instead of adding fallbacks
- **Rule**: Don't add defensive queries "just in case" - fix the root cause

### 24. Security: HTTP Protocol for Specific Domains

**Problem**: Strict HTTPS-only policy blocks legitimate HTTP requests for domains that don't support HTTPS (e.g., rule34.xxx).

**Why it's bad**:
- Breaks functionality for legitimate use cases
- Overly restrictive security policy
- User can't access content that exists but isn't available via HTTPS

**Solution**:
- **Allow HTTP only for specific whitelisted domains** (e.g., `rule34.xxx`)
- Keep HTTPS requirement for all other domains
- Validate domain before allowing HTTP protocol
- Document security rationale in code comments
- **Rule**: Security policies should be strict by default, but allow exceptions for specific, documented use cases

### 25. Security: URL Validation Order in openExternal

**Problem**: Validating protocol after parsing hostname allows dangerous protocols to be processed before rejection.

**Why it's bad**:
- Security vulnerability - dangerous protocols processed before validation
- Potential for protocol injection if validation logic has bugs
- Violates "fail fast" principle

**Solution**:
- **Validate protocol FIRST** before any other URL processing
- Use explicit `allowedProtocols` array for strict whitelist
- Reject all protocols not in whitelist immediately
- Only then validate hostname and other URL components
- **Rule**: Always validate security-critical fields (protocol, hostname) before processing URL

### 26. Synchronous SQLite Calls in Runtime

**Problem**: Calling `sqlite.prepare().get()` synchronously during request handling blocks the event loop.

**Why it's bad**:
- Blocks IPC channel during database query
- Can cause UI freezes in high-load scenarios
- Violates async/await pattern expectations
- First call is always blocking, even with caching

**Solution**:
- **Initialize database checks at startup** (in `setup()` method)
- Move synchronous SQLite calls to initialization phase
- Cache results for runtime use (schema doesn't change)
- Runtime methods return cached values only
- **Rule**: Never perform synchronous database operations in request handlers - initialize at startup

### 27. O(N) Map Creation on Cache Updates

**Problem**: Creating `Map<number, Post>` from all pages on every cache update (e.g., when post marked as viewed) is expensive for large datasets.

**Why it's bad**:
- O(N) operation on every cache change
- Allocates memory for Map even when post is in first page
- For 2000 posts, creates 2000 Map entries on every update
- Performance degrades linearly with dataset size

**Solution**:
- **Use direct search** (`page.find()`) instead of Map creation
- Direct search stops at first match (typically faster)
- No memory allocation for Map structure
- Only searches until post is found
- **Rule**: Avoid creating data structures (Maps, Arrays) on every render - use direct search when possible

### 28. Magic Numbers in IPC Validation

**Problem**: Using `z.number().int().min(0).max(5)` for tag types in IPC validation uses magic numbers.

**Why it's bad**:
- Hard to understand what 0-5 means without context
- No type safety - compiler can't catch invalid values
- Makes refactoring difficult if tag types change
- Inconsistent with TAG_TYPES constants used elsewhere

**Solution**:
- **Use Zod refine with TAG_TYPES constants** for validation
- `z.number().int().refine((val): val is TagType => Object.values(TAG_TYPES).includes(val))`
- Provides type safety and clear error messages
- Single source of truth (TAG_TYPES constants)
- **Rule**: Never use magic numbers in validation schemas - always use constants with type checking

### 29. Code Duplication: DRY Violation

**Problem**: `escapeLikePattern` function duplicated in `ArtistsController` and `PostsController`.

**Why it's bad**:
- Violates DRY (Don't Repeat Yourself) principle
- Bug fixes must be applied in multiple places
- Inconsistent implementations can diverge over time
- Increases maintenance burden

**Solution**:
- **Extract shared utilities to `src/main/db/utils.ts`**
- Create single `escapeLikePattern` function
- Import and use in all controllers
- Single source of truth for logic
- **Rule**: Extract duplicated logic to shared utilities - DRY applies to all code, not just business logic

### 30. console.warn in Electron Renderer

**Problem**: Using `console.warn` in Electron renderer process creates noise in DevTools console that nobody reads.

**Why it's bad**:
- Console logs in Electron are not persistent
- No way to track warnings in production
- Pollutes DevTools console with expected edge cases
- Inconsistent with logging standards (electron-log)

**Solution**:
- **Use `electron-log/renderer` for all logging** in renderer process
- Only log significant issues (not expected edge cases)
- Silent handling for common validation failures
- Consistent logging across main and renderer processes
- **Rule**: Never use `console.*` in production code - always use electron-log for proper logging

### 31. Duplicate Log Files (main.log vs app.log)

**Problem**: `electron-log` creates separate `main.log` and `renderer.log` files by default, but all logs go to `app.log`, making other files useless.

**Why it's bad**:
- `main.log` contains only 1-2 lines (DI init)
- `renderer.log` is duplicate of `app.log`
- Multiple files make debugging harder (need to check multiple files)
- Wastes disk space and creates confusion

**Solution**:
- **Disable separate log transports**: `log.transports.main.level = false` and `log.transports.renderer.level = false`
- Use single unified `app.log` for all processes
- Preserves chronological order of events across processes
- Easier debugging with single log file
- **Rule**: Use single unified log file for Electron apps - disable separate process logs

### 32. Unsafe Type Casting in IPC Handlers

**Problem**: Using `as Promise<unknown>` and `as TagType` in IPC handlers bypasses TypeScript's type checking.

**Why it's bad**:
- `as` casting tells compiler "shut up, I know better" - but you usually don't
- Hides type errors that should be caught at compile time
- Makes code less maintainable and error-prone
- Indicates lazy type system design

**Solution**:
- **Remove unnecessary `as Promise<unknown>`** - BaseController already accepts `Promise<unknown>`
- **Fix Zod refine** - use `Object.values(TAG_TYPES) as number[]` instead of `as TagType` casting
- **Use explicit type extraction** in handler wrapper: `const [tags, tagType] = args as [string[], TagType]` only after Zod validation
- **Rule**: Never use `as` casting to silence TypeScript - fix types upstream instead

### 33. IPC DoS Attack Vulnerability

**Problem**: IPC handlers have no throttling, allowing renderer to spam calls and overwhelm Main process.

**Why it's bad**:
- Renderer can send unlimited IPC calls per second
- Main process event loop gets blocked by excessive handler calls
- Can cause UI freezes and application crashes
- No protection against malicious or buggy renderer code

**Solution**:
- **Add throttling in BaseController**: Track last call time per channel using static `throttleMap`
- **Minimum interval between calls**: 100ms per channel (max 10 calls/sec)
- **Automatic delay**: If called too frequently, wait before processing
- **Rule**: Always add throttling/rate limiting to IPC handlers to prevent DoS attacks

### 34. O(N) Performance in useCurrentPost (Map vs Linear Search)

**Problem**: Creating `Map<number, Post>` on every cache update is O(N) operation, but provides O(1) lookup. Linear search is also O(N) but doesn't allocate memory.

**Why it's bad**:
- Map creation is O(N) and happens on every cache update (e.g., post marked as viewed)
- For 2000 posts, creates 2000 Map entries on every update
- Linear search is also O(N) but stops at first match
- Need to balance: O(N) Map creation vs O(N) search on every render

**Solution**:
- **Use Map with useMemo**: Create Map when `infiniteData` changes (new pages or cache updates)
- **O(1) lookup**: Map provides constant-time lookup for `currentPostId`
- **Acceptable trade-off**: O(N) Map creation when data changes vs O(N) search on every render
- **Rule**: Use Map for O(1) lookup when data structure changes infrequently compared to lookup frequency

### 35. Magic Strings for Domain Whitelisting

**Problem**: Hardcoded domain strings like `"rule34.xxx"` and `"www.rule34.xxx"` scattered in code.

**Why it's bad**:
- Hard to maintain - need to update multiple places if domain changes
- No single source of truth
- Easy to miss one instance when updating
- Inconsistent with constant-based approach used elsewhere

**Solution**:
- **Create `HTTP_ALLOWED_DOMAINS` constant** in `src/main/config/allowed-hosts.ts`
- **Use constant instead of hardcoded strings**: `HTTP_ALLOWED_DOMAINS.includes(hostname)`
- **Single source of truth** for domain whitelisting
- **Rule**: Never hardcode domain names or URLs - always use constants

### 36. Code Duplication: Mixed Logic in SyncService

**Problem**: `syncArtist` method contains both initial sync and incremental sync logic with complex branching (`isInitialSync` ternary).

**Why it's bad**:
- Single method does too much (violates Single Responsibility Principle)
- Complex branching makes code hard to understand and maintain
- Magic number `MAX_PAGES_SAFETY_LIMIT = 1000` defined inside method
- Difficult to test and debug

**Solution**:
- **Extract constant**: Move `MAX_PAGES_SAFETY_LIMIT` to module level
- **Split method**: Create separate `initialSync()` and `incrementalSync()` methods
- **Clear separation**: Each method handles one specific case
- **Rule**: Split complex methods with branching logic into separate methods - one responsibility per method

### 37. Zustand Selectors: useShallow vs Individual Selectors

**Problem**: Using `useShallow` with object destructuring still causes re-renders when any field in the object changes, even if component only uses specific fields.

**Why it's bad**:
- `useShallow` compares entire object, not individual fields
- Component re-renders when ANY field in selected object changes
- Performance anti-pattern - breaks React optimization
- Can cause unnecessary re-renders of large component trees

**Solution**:
- **Use individual selectors** instead of `useShallow` with destructuring:
  ```typescript
  // BAD: useShallow with destructuring
  const { open, appendQueueIds } = useViewerStore(
    useShallow((state) => ({ open: state.open, appendQueueIds: state.appendQueueIds }))
  );
  
  // GOOD: Individual selectors
  const open = useViewerStore((state) => state.open);
  const appendQueueIds = useViewerStore((state) => state.appendQueueIds);
  ```
- **Each selector subscribes only to its specific value**
- **Rule**: Always use individual selectors for Zustand - avoid `useShallow` with destructuring

### 38. Global State Leakage: Search Query Affecting Unrelated Components

**Problem**: `ArtistGallery` component used global `searchStore.query` to filter posts, causing posts to disappear when a search query from Browse tab was set (e.g., clicking a tag in ViewerDialog).

**Why it's bad**:
- Global state from one context (Browse search) affects unrelated components (ArtistGallery)
- User expects to see ALL posts for an artist in Tracked Artists, not filtered by Browse search
- Creates confusing UX where posts "disappear" due to unrelated state
- Violates separation of concerns - ArtistGallery should be independent of Browse search state

**Solution**:
- **Remove global state dependency** from components that should show all data
- `ArtistGallery` should always show all posts for an artist, not filtered by global search query
- Global search query (`searchStore`) should only affect Browse tab, not Tracked Artists
- **Rule**: Don't use global state in components that should display unfiltered data - each component should have clear, independent data requirements

## Applied Fixes

✅ Removed log forwarding from Main to Renderer  
✅ Replaced regex XML parsing with `fast-xml-parser`  
✅ Fixed `require` → `import` in PostsController  
✅ Fixed N+1 in ArtistCard with JOIN query  
✅ Simplified searchStore validation (removed excessive log patterns)  
✅ Fixed Zustand selectors everywhere  
✅ Improved Drizzle type safety in PostsController  
✅ Fixed searchStore bug (can't clear search) - removed length check  
✅ Removed EXPLAIN QUERY PLAN from ArtistsController  
✅ Cached checkFtsTableExists in PostsController  
✅ Replaced useEffect with useMemo in Browse.tsx  
✅ Added Zod validation for API responses in resolveTags  
✅ Added max(100) limit for resolveTags input  
✅ Wrapped bulk insert in transaction for atomicity  
✅ Added aria-live announcements for keyboard shortcuts (F/V)  
✅ Implemented XML Fallback for Rule34 API when JSON returns empty string  
✅ Added Smart Search Fallback (autocomplete + user: prefix) for uploader searches  
✅ Fixed ViewerDialog tag categorization (Copyright, Character, Artist, General)  
✅ Improved UX: Added "Open on Rule34.xxx" button when API returns 0 results  
✅ Fixed control character regex in searchStore (replaced with charCodeAt filter)  
✅ Fixed tag normalization inconsistency: SearchController now uses provider.formatTag() instead of manual replace  
✅ Fixed XML parser structure normalization: fast-xml-parser single object vs array handling  
✅ Replaced regex XML parsing with fast-xml-parser in parsePostXml (removed regex-based approach)  
✅ Added getHeaders() method for standardized API request headers (prevents API blocking)  
✅ Fixed Rule34 pagination: 0-based pid conversion (page 1 → pid=0)  
✅ Optimized XMLParser: created as readonly class field with attributeNamePrefix: "" for direct attribute access
✅ Fixed useCurrentPost reactivity: replaced getQueryData with useQuery (enabled: false) for reactive cache access
✅ Removed residual N+1 queries: removed unnecessary useQuery for postsCount in ArtistCard (trusts JOIN query)
✅ Fixed provider abstraction violation: replaced direct URL access with provider.searchTags() in SearchController
✅ Replaced magic numbers with TAG_TYPES constants for tag type safety
✅ Updated openExternal security: allow HTTP for rule34.xxx domain while keeping HTTPS for others
✅ Enhanced openExternal security: validate protocol FIRST before hostname (fail-fast security)
✅ Fixed synchronous SQLite calls: moved checkFtsTableExists to setup() initialization
✅ Optimized useCurrentPost: use Map with useMemo for O(1) lookup (better than O(N) search on every render)
✅ Fixed magic numbers in IPC: replaced z.number().min(0).max(5) with TAG_TYPES refine validation
✅ Extracted escapeLikePattern to utils: eliminated DRY violation in ArtistsController and PostsController
✅ Replaced console.warn with electron-log in searchStore: proper logging instead of console noise
✅ Disabled duplicate log files: unified main.log and renderer.log into single app.log
✅ Removed unsafe type casting: fixed as Promise<unknown> and as TagType in SearchController
✅ Added IPC throttling: 100ms minimum interval per channel to prevent DoS attacks
✅ Optimized useCurrentPost: use Map with useMemo for O(1) lookup instead of O(N) search
✅ Extracted domain constants: HTTP_ALLOWED_DOMAINS in allowed-hosts.ts instead of hardcoded strings
✅ Refactored SyncService: split syncArtist into initialSync and incrementalSync methods
✅ Fixed Zustand selectors: replaced useShallow destructuring with individual selectors in Updates.tsx and Favorites.tsx
✅ Fixed global state leakage: removed searchStore dependency from ArtistGallery - now shows all posts for artist regardless of Browse search query
