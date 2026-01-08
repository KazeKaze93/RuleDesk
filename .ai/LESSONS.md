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
- Created `parsePostXml` method using regex to extract post attributes from XML
- **Note**: XML parsing uses regex for simple attribute extraction (acceptable for fallback scenario)
- Direct mapping to `BooruPost` format ensures UI compatibility

**Key Implementation**:
- Try JSON first, catch errors and retry with XML
- Parse XML using regex pattern `/<post\s+([^>]+)>/g` (simple attribute extraction)
- Map attributes directly to camelCase `BooruPost` format
- Use `selectBestPreview` for previewUrl with fallback to fileUrl

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
