# Unit Tests for Gallery Implementation

This directory contains unit tests for the recent gallery refactoring work, including infinite scroll, layout switching, and filter components.

## Test Coverage

### ✅ Hooks
- **`useGalleryInfiniteScroll.test.ts`** - Tests for the reusable infinite scroll hook
  - Default pagination logic (Local DB - stops when < 50 posts)
  - Custom pagination logic (External API - continues until empty array)
  - Edge cases and multiple pages

### ✅ Components

#### Filters
- **`SourceSwitcher.test.ts`** - Tests for source filter toggle group
  - Value handling (all, favorites, subscriptions)
  - Disabled state logic
  - CSS classes and styling

- **`FilterToggleGroup.test.ts`** - Tests for filter toggle group component
  - Option handling (string/array values)
  - Disabled options with tooltips
  - Icon handling

#### Layout
- **`GridContainer.test.ts`** - Tests for grid/masonry container logic
  - Grid viewType CSS classes
  - Masonry viewType CSS classes (flexbox)
  - Responsive width calculations
  - ItemContainer classes

- **`PostCard/viewType.test.ts`** - Tests for PostCard viewType adaptation
  - Grid viewType styling (aspect-[3/4], object-cover)
  - Masonry viewType styling (natural aspect ratio)
  - ViewType switching logic

#### Infinite Scroll
- **`IntersectionObserver.test.ts`** - Tests for IntersectionObserver configuration
  - Observer configuration (threshold, rootMargin)
  - Callback logic (intersecting, hasNextPage, isFetchingNextPage checks)
  - Observer cleanup and memory management
  - ViewType change handling

### ✅ Utilities
- **`filter-utils.test.ts`** - Tests for filter utility functions
  - `hasAiGeneratedTag` - AI tag detection
  - `isVideoPost` - Video file detection

## Running Tests

### Run all unit tests
```bash
npm test -- tests/unit --run
```

### Run specific test file
```bash
npm test -- tests/unit/lib/filter-utils.test.ts --run
```

### Run tests in watch mode
```bash
npm test -- tests/unit
```

### Run with coverage
```bash
npm run test:coverage
```

## Test Structure

Tests follow the existing project patterns:
- Use Vitest (no @testing-library/react dependency)
- Test logic directly without React rendering where possible
- Mock dependencies (electron-log, React hooks, etc.)
- Follow AAA pattern (Arrange, Act, Assert)

## What's Tested

### Infinite Scroll Logic
- ✅ Default pagination (stops when page < 50 posts) - for Local DB
- ✅ Custom pagination (continues until empty array) - for External API
- ✅ Multiple pages handling
- ✅ Edge cases (empty pages, exact 50 posts)

### Layout Switching
- ✅ Grid vs Masonry CSS classes
- ✅ Responsive width calculations
- ✅ PostCard styling based on viewType

### Filter Components
- ✅ Value handling and type conversion
- ✅ Disabled state logic
- ✅ CSS classes and styling

### IntersectionObserver
- ✅ Configuration (threshold: 0.1, rootMargin: '400px')
- ✅ Callback conditions (intersecting + hasNextPage + !isFetchingNextPage)
- ✅ Cleanup on viewType change
- ✅ Memory leak prevention

## Notes

- Tests use Vitest's `node` environment (not `jsdom`)
- React components are tested through logic verification, not rendering
- For full component integration tests, consider E2E tests with Playwright
- All tests pass with current implementation ✅

## Future Improvements

For more comprehensive testing, consider:
1. Adding `@testing-library/react` for component rendering tests
2. Setting up `jsdom` environment for DOM-related tests
3. Creating integration tests for full component interactions
4. Adding visual regression tests for layout changes
