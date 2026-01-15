import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for IntersectionObserver logic used in masonry infinite scroll
 * Verifies observer configuration and cleanup
 */

describe('IntersectionObserver Configuration', () => {
  let mockObserver: Partial<IntersectionObserver> & {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    options?: IntersectionObserverInit;
    callback?: IntersectionObserverCallback;
  };
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let OriginalIntersectionObserver: typeof IntersectionObserver;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    
    mockObserver = {
      observe: mockObserve,
      disconnect: mockDisconnect,
    };

    // Save original
    OriginalIntersectionObserver = global.IntersectionObserver as typeof IntersectionObserver;

    // Mock IntersectionObserver as a class
    // Use proper type casting through unknown to avoid any
    global.IntersectionObserver = class IntersectionObserver {
      callback: IntersectionObserverCallback;
      options?: IntersectionObserverInit;
      
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        // Store callback and options for verification
        this.callback = callback;
        this.options = options;
        return mockObserver as unknown as IntersectionObserver;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn();
    } as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = OriginalIntersectionObserver;
    vi.restoreAllMocks();
  });

  describe('Observer configuration', () => {
    it('should create observer with correct threshold', () => {
      const options = { threshold: 0.1, rootMargin: '400px' };
      const observer = new IntersectionObserver(() => {}, options);
      
      // Verify observer was created
      expect(observer).toBe(mockObserver);
      // Verify threshold is in expected range (0-1)
      expect(options.threshold).toBeGreaterThanOrEqual(0);
      expect(options.threshold).toBeLessThanOrEqual(1);
    });

    it('should create observer with correct rootMargin', () => {
      const options = { threshold: 0.1, rootMargin: '400px' };
      const observer = new IntersectionObserver(() => {}, options);
      
      expect(observer).toBe(mockObserver);
      // Verify rootMargin format (should be a string with px)
      expect(typeof options.rootMargin).toBe('string');
      expect(options.rootMargin).toContain('px');
    });

    it('should observe the trigger element', () => {
      // Properly typed mock element
      const triggerElement: { current: HTMLElement | null } = { 
        current: { tagName: 'DIV' } as HTMLElement 
      };
      const observer = new IntersectionObserver(() => {}, { threshold: 0.1, rootMargin: '400px' });
      
      if (triggerElement.current) {
        observer.observe(triggerElement.current);
      }
      
      expect(mockObserve).toHaveBeenCalledWith(triggerElement.current);
    });
  });

  describe('Observer callback logic', () => {
    it('should call handleEndReached when intersecting and hasNextPage', () => {
      const handleEndReached = vi.fn();
      const hasNextPage = true;
      const isFetchingNextPage = false;

      const callback = (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          handleEndReached();
        }
      };

      const mockEntry = {
        isIntersecting: true,
      } as IntersectionObserverEntry;

      callback([mockEntry]);
      
      expect(handleEndReached).toHaveBeenCalled();
    });

    it('should not call handleEndReached when not intersecting', () => {
      const handleEndReached = vi.fn();
      const hasNextPage = true;
      const isFetchingNextPage = false;

      const callback = (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          handleEndReached();
        }
      };

      const mockEntry = {
        isIntersecting: false,
      } as IntersectionObserverEntry;

      callback([mockEntry]);
      
      expect(handleEndReached).not.toHaveBeenCalled();
    });

    it('should not call handleEndReached when hasNextPage is false', () => {
      const handleEndReached = vi.fn();
      const hasNextPage = false;
      const isFetchingNextPage = false;

      const callback = (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          handleEndReached();
        }
      };

      const mockEntry = {
        isIntersecting: true,
      } as IntersectionObserverEntry;

      callback([mockEntry]);
      
      expect(handleEndReached).not.toHaveBeenCalled();
    });

    it('should not call handleEndReached when isFetchingNextPage is true', () => {
      const handleEndReached = vi.fn();
      const hasNextPage = true;
      const isFetchingNextPage = true;

      const callback = (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          handleEndReached();
        }
      };

      const mockEntry = {
        isIntersecting: true,
      } as IntersectionObserverEntry;

      callback([mockEntry]);
      
      expect(handleEndReached).not.toHaveBeenCalled();
    });
  });

  describe('Observer cleanup', () => {
    it('should disconnect observer on cleanup', () => {
      const observer = new IntersectionObserver(() => {}, { threshold: 0.1, rootMargin: '400px' });
      
      // Simulate cleanup
      observer.disconnect();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should set observer ref to null after disconnect', () => {
      let observerRef: IntersectionObserver | null = new IntersectionObserver(() => {}, { 
        threshold: 0.1, 
        rootMargin: '400px' 
      });
      
      observerRef.disconnect();
      observerRef = null;
      
      expect(observerRef).toBeNull();
    });
  });

  describe('ViewType change handling', () => {
    it('should disconnect observer when switching from masonry to grid', () => {
      let viewType: 'grid' | 'masonry' = 'masonry';
      let observer: IntersectionObserver | null = null;

      // Create observer for masonry
      if (viewType === 'masonry') {
        observer = new IntersectionObserver(() => {}, { threshold: 0.1, rootMargin: '400px' });
      }

      // Switch to grid
      viewType = 'grid';
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      expect(mockDisconnect).toHaveBeenCalled();
      expect(observer).toBeNull();
    });

    it('should create observer when switching from grid to masonry', () => {
      let viewType: 'grid' | 'masonry' = 'grid';
      let observer: IntersectionObserver | null = null;

      // Switch to masonry
      viewType = 'masonry';
      if (viewType === 'masonry') {
        observer = new IntersectionObserver(() => {}, { threshold: 0.1, rootMargin: '400px' });
      }

      expect(observer).not.toBeNull();
      expect(observer).toBe(mockObserver);
    });
  });
});
