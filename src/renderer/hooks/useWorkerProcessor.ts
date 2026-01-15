import { useEffect, useRef, useState, useCallback } from "react";
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
 * React hook for Web Worker-based data processing
 * 
 * Provides a Promise-based API for sending tasks to the worker and receiving results.
 * Automatically handles worker lifecycle (creation, cleanup) and loading state.
 * 
 * @example
 * const { processData, loading } = useWorkerProcessor();
 * const result = await processData({ posts, filters });
 */
export function useWorkerProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: WorkerPost[]) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  useEffect(() => {
    // Create worker with proper Vite worker import syntax
    const worker = new Worker(
      new URL("../workers/data-processor.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Handle worker messages
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse<WorkerPost[]>>) => {
      const { id, success, data, error } = event.data;

      const pending = pendingRequestsRef.current.get(id);
      if (!pending) {
        console.warn(`[useWorkerProcessor] Received response for unknown request: ${id}`);
        return;
      }

      pendingRequestsRef.current.delete(id);

      if (success && data) {
        pending.resolve(data);
      } else {
        pending.reject(new Error(error || "Worker processing failed"));
      }

      // Update loading state when all requests are complete
      if (pendingRequestsRef.current.size === 0) {
        setLoading(false);
      }
    });

    // Handle worker errors
    worker.addEventListener("error", (error) => {
      console.error("[useWorkerProcessor] Worker error:", error);
      setLoading(false);
      // Reject all pending requests
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error(`Worker error: ${error.message}`));
      });
      pendingRequestsRef.current.clear();
    });

    workerRef.current = worker;

    // Cleanup: terminate worker on unmount
    return () => {
      // Reject all pending requests
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error("Worker terminated"));
      });
      pendingRequestsRef.current.clear();

      worker.terminate();
      workerRef.current = null;
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
      const worker = workerRef.current;
      if (!worker) {
        throw new Error("Worker not initialized");
      }

      // Generate unique request ID
      const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Create promise for this request
      return new Promise<WorkerPost[]>((resolve, reject) => {
        pendingRequestsRef.current.set(id, { resolve, reject });
        setLoading(true);

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
