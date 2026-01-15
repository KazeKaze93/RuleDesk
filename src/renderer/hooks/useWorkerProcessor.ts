import { useEffect, useState, useCallback } from "react";
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
        console.warn(`[useWorkerProcessor] Received response for unknown request: ${id}`);
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
      console.error("[useWorkerProcessor] Worker error:", error);
      updateLoadingState(false);
      
      // Reject all pending requests
      const pendingCopy = new Map(globalPendingRequests);
      globalPendingRequests.clear();
      pendingCopy.forEach(({ reject }) => {
        reject(new Error(`Worker error: ${error.message}`));
      });
      
      // Restart worker if attempts remaining
      if (workerRestartAttempts < MAX_RESTART_ATTEMPTS) {
        workerRestartAttempts++;
        console.warn(
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
              console.error("[useWorkerProcessor] Worker restart failed:", restartError);
            }
          }
        }, RESTART_DELAY_MS);
      } else {
        console.error(
          "[useWorkerProcessor] Max restart attempts reached. Worker will not restart."
        );
      }
    });
    
    // Handle worker termination (unexpected shutdown)
    globalWorker.addEventListener("messageerror", (error) => {
      console.error("[useWorkerProcessor] Worker message error:", error);
      // Same restart logic as error handler
      const pendingCopy = new Map(globalPendingRequests);
      globalPendingRequests.clear();
      pendingCopy.forEach(({ reject }) => {
        reject(new Error("Worker message error"));
      });
      
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
              console.error("[useWorkerProcessor] Worker restart failed:", restartError);
            }
          }
        }, RESTART_DELAY_MS);
      }
    });
  }
  return globalWorker;
}

/**
 * Cleanup worker when no longer needed
 * 
 * Note: In React Strict Mode (dev), useEffect cleanup runs twice.
 * We use ref count to ensure worker is only terminated when truly unused.
 */
function releaseWorker(): void {
  if (globalWorkerRefCount > 0) {
    globalWorkerRefCount--;
  }
  
  // Only terminate worker if ref count reaches 0 and worker exists
  if (globalWorkerRefCount <= 0 && globalWorker) {
    // Reject all pending requests
    globalPendingRequests.forEach(({ reject }) => {
      reject(new Error("Worker terminated"));
    });
    globalPendingRequests.clear();
    loadingStateCallbacks.clear();

    globalWorker.terminate();
    globalWorker = null;
    globalWorkerRefCount = 0; // Reset to prevent negative values
  }
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
        console.error("[useWorkerProcessor] Cleanup error:", error);
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
