import { useEffect, useState, useCallback } from "react";
import log from "electron-log/renderer";
import type { WorkerPost } from "../../shared/types/post";

/**
 * Filter configuration for worker processing
 */
export interface WorkerFilterConfig {
  aiFilter: "all" | "hide" | "only";
  mediaType: "all" | "images" | "videos";
  source: "all" | "favorites" | "subscriptions";
  sortOrder: "asc" | "desc";
  trackedTagsSet?: string[];
  tags?: string[];
}

/**
 * Worker message types
 */
interface WorkerRequest {
  id: string;
  action: string;
  payload: unknown;
}

interface WorkerResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Singleton Worker instance to prevent memory leaks
 * Creating a Worker is expensive, so we reuse a single instance across all hook calls
 */
let globalWorker: Worker | null = null;
let globalWorkerRefCount = 0;
let workerRestartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 1000; // 1 second delay between restart attempts
const globalPendingRequests = new Map<string, {
  resolve: (value: WorkerPost[]) => void;
  reject: (error: Error) => void;
}>();

// Track loading state callbacks from all hook instances
const loadingStateCallbacks = new Set<(loading: boolean) => void>();

/**
 * Update loading state for all hook instances
 */
function updateLoadingState(loading: boolean): void {
  loadingStateCallbacks.forEach((callback) => callback(loading));
}

/**
 * Initialize or get existing worker instance
 */
function getWorker(): Worker {
  if (!globalWorker) {
    // Reset restart attempts on successful initialization
    workerRestartAttempts = 0;
    
    globalWorker = new Worker(
      new URL("../workers/data-processor.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Handle worker messages
    globalWorker.addEventListener("message", (event: MessageEvent<WorkerResponse<WorkerPost[]>>) => {
      const { id, success, data, error } = event.data;

      const pending = globalPendingRequests.get(id);
      if (!pending) {
        log.warn(`[useWorkerProcessor] Received response for unknown request: ${id}`);
        return;
      }

      globalPendingRequests.delete(id);

      // Update loading state when all requests are complete
      if (globalPendingRequests.size === 0) {
        updateLoadingState(false);
      }

      if (success && data) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error || "Worker processing failed"));
      }
    });

    // Handle worker errors with restart policy
    globalWorker.addEventListener("error", (error) => {
      log.error("[useWorkerProcessor] Worker error:", error);
      updateLoadingState(false);
      
      // CRITICAL: Reject all pending requests BEFORE clearing map
      // This ensures all promises in renderer are properly handled
      const pendingCopy = new Map(globalPendingRequests);
      globalPendingRequests.clear();
      
      // Reject all promises asynchronously to prevent blocking
      // Use setTimeout to ensure rejections happen after current stack
      setTimeout(() => {
        pendingCopy.forEach(({ reject }) => {
          try {
            reject(new Error(`Worker error: ${error.message}`));
          } catch (rejectError) {
            // Ignore errors from reject (promise already settled)
            log.warn("[useWorkerProcessor] Error rejecting promise:", rejectError);
          }
        });
      }, 0);
      
      // Restart worker if attempts remaining
      if (workerRestartAttempts < MAX_RESTART_ATTEMPTS) {
        workerRestartAttempts++;
        log.warn(
          `[useWorkerProcessor] Restarting worker (attempt ${workerRestartAttempts}/${MAX_RESTART_ATTEMPTS})`
        );
        
        // Clean up failed worker
        try {
          globalWorker?.terminate();
        } catch (_e) {
          // Ignore termination errors
        }
        globalWorker = null;
        
        // Restart after delay
        setTimeout(() => {
          if (globalWorkerRefCount > 0) {
            // Only restart if still needed
            try {
              getWorker(); // Reinitialize worker
            } catch (restartError) {
              log.error("[useWorkerProcessor] Worker restart failed:", restartError);
            }
          }
        }, RESTART_DELAY_MS);
      } else {
        log.error(
          "[useWorkerProcessor] Max restart attempts reached. Worker will not restart."
        );
        // Reset refCount to prevent memory leak if worker is permanently dead
        // This allows cleanup on unmount even if worker failed
        globalWorkerRefCount = 0;
      }
    });
    
    // Handle worker termination (unexpected shutdown)
    globalWorker.addEventListener("messageerror", (error) => {
      log.error("[useWorkerProcessor] Worker message error:", error);
      updateLoadingState(false);
      
      // Same restart logic as error handler
      const pendingCopy = new Map(globalPendingRequests);
      globalPendingRequests.clear();
      
      // Reject all promises asynchronously
      setTimeout(() => {
        pendingCopy.forEach(({ reject }) => {
          try {
            reject(new Error("Worker message error"));
          } catch (rejectError) {
            log.warn("[useWorkerProcessor] Error rejecting promise:", rejectError);
          }
        });
      }, 0);
      
      if (workerRestartAttempts < MAX_RESTART_ATTEMPTS) {
        workerRestartAttempts++;
        try {
          globalWorker?.terminate();
        } catch (_e) {
          // Ignore
        }
        globalWorker = null;
        setTimeout(() => {
          if (globalWorkerRefCount > 0) {
            try {
              getWorker();
            } catch (restartError) {
              log.error("[useWorkerProcessor] Worker restart failed:", restartError);
            }
          }
        }, RESTART_DELAY_MS);
      } else {
        // Reset refCount to prevent memory leak
        globalWorkerRefCount = 0;
      }
    });
  }
  return globalWorker;
}

/**
 * Cleanup worker when no longer needed
 * 
 * CRITICAL: In React Strict Mode (dev), useEffect cleanup runs twice.
 * Race condition: First cleanup decrements refCount, second cleanup sees 0 and terminates worker
 * even though second "instance" still needs it.
 * 
 * Fix: Use setTimeout(0) to check refCount AFTER all microtasks complete.
 * This ensures both cleanup calls have finished decrementing before termination check.
 * Note: setImmediate is Node.js-only, so we use setTimeout(0) which works in browser context.
 */
function releaseWorker(): void {
  if (globalWorkerRefCount > 0) {
    globalWorkerRefCount--;
  }
  
  // CRITICAL: Use setTimeout(0) to check refCount AFTER all microtasks
  // In React Strict Mode, both cleanup functions run synchronously, but we need to
  // check the final refCount after both have decremented
  // setTimeout(0) schedules callback in next event loop tick (after all microtasks)
  // This is equivalent to setImmediate but works in browser/Renderer context
  setTimeout(() => {
    // Re-check refCount after all microtasks (including second cleanup) have run
    if (globalWorkerRefCount <= 0 && globalWorker) {
      // Reject all pending requests
      globalPendingRequests.forEach(({ reject }) => {
        try {
          reject(new Error("Worker terminated"));
        } catch (rejectError) {
          // Ignore errors from reject (promise already settled)
          log.warn("[useWorkerProcessor] Error rejecting promise:", rejectError);
        }
      });
      globalPendingRequests.clear();
      loadingStateCallbacks.clear();

      globalWorker.terminate();
      globalWorker = null;
      globalWorkerRefCount = 0; // Reset to prevent negative values
    }
  }, 0);
}

/**
 * React hook for Web Worker-based data processing
 * 
 * Provides a Promise-based API for sending tasks to the worker and receiving results.
 * Uses singleton worker instance to prevent memory leaks and improve performance.
 * 
 * @example
 * const { processData, loading } = useWorkerProcessor();
 * const result = await processData({ posts, filters });
 */
export function useWorkerProcessor() {
  const [loading, setLoading] = useState(false);

  // Initialize worker on mount, release on unmount
  useEffect(() => {
    try {
      globalWorkerRefCount++;
      
      // Register loading state callback
      loadingStateCallbacks.add(setLoading);
    } catch (error) {
      // If initialization fails, ensure cleanup
      loadingStateCallbacks.delete(setLoading);
      releaseWorker();
      throw error;
    }
    
    return () => {
      try {
        loadingStateCallbacks.delete(setLoading);
        releaseWorker();
      } catch (error) {
        // Ensure cleanup even if releaseWorker fails
        log.error("[useWorkerProcessor] Cleanup error:", error);
      }
    };
  }, []);


  /**
   * Process data using the worker
   * Returns a Promise that resolves with the processed posts
   */
  const processData = useCallback(
    async (params: {
      posts: WorkerPost[];
      filters: WorkerFilterConfig;
    }): Promise<WorkerPost[]> => {
      const worker = getWorker();
      if (!worker) {
        throw new Error("Worker not initialized");
      }

      // Generate unique request ID
      const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create promise for this request
      return new Promise<WorkerPost[]>((resolve, reject) => {
        globalPendingRequests.set(id, { resolve, reject });
        
        // Update loading state when request starts
        if (globalPendingRequests.size === 1) {
          updateLoadingState(true);
        }

        const request: WorkerRequest = {
          id,
          action: "FILTER_AND_SORT",
          payload: params,
        };

        worker.postMessage(request);
      });
    },
    []
  );

  return {
    processData,
    loading,
  };
}
