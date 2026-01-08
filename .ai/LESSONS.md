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
**Problem**: Using regular expressions to parse XML in `parseTagXmlResponse`.

**Why it's dangerous**:
- ReDoS attacks possible
- Breaks if attributes change order
- Fragile and error-prone

**Fix**: 
- Use `fast-xml-parser` or similar library
- Force API to return only JSON if possible
- Never parse XML/HTML with regex

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
**Problem**: Using `as { name: string } | undefined` for `stmt.get()` result.

**Fix**: 
- Drizzle allows typed queries via `db.run` or `db.all`
- Avoid `any` and manual casts
- Use generic types: `sqlite.prepare<[], { name: string }>()`

### 8. Zustand Selectors
**Problem**: Using `const { query } = useSearchStore()` in some places.

**Why it's bad**:
- Causes re-render on ANY state change in store
- Performance anti-pattern

**Fix**: 
- Use selectors: `const query = useSearchStore((state) => state.query)`
- Fix everywhere (Favorites.tsx, Updates.tsx, etc.)

### 9. Optimize resolveTags
**Problem**: Hitting API one tag at a time in loop (even with limit of 5).

**Fix**: 
- Check Rule34 API docs for batching support
- Some endpoints support tag lists or masks
- Reduce API calls significantly

## Applied Fixes

✅ Removed log forwarding from Main to Renderer  
✅ Replaced regex XML parsing with `fast-xml-parser`  
✅ Fixed `require` → `import` in PostsController  
✅ Fixed N+1 in ArtistCard with JOIN query  
✅ Simplified searchStore validation (removed excessive log patterns)  
✅ Fixed Zustand selectors everywhere  
✅ Improved Drizzle type safety in PostsController  
