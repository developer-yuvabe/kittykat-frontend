import { useCallback, useRef, useEffect } from "react";
import debounce from "lodash/debounce";

type ReorderItem = { id: string; brand_sort_order: number };

interface UseDebouncedReorderOptions {
  /** Function to update cache immediately (optimistic update) */
  updateCache: (data: ReorderItem[]) => void;
  /** Function to sync with API */
  syncToApi: (data: ReorderItem[]) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000ms) */
  delay?: number;
  /** Called on API error */
  onError?: (error: unknown) => void;
}

/**
 * Hook for debounced gallery reordering.
 * 
 * Behavior:
 * - Cache updates happen immediately (instant UI feedback)
 * - API sync is debounced: only syncs after user stops for [delay]ms
 * - Each new action resets the timer
 * - Only ONE sync happens after user stops making changes
 */
export function useDebouncedReorder({
  updateCache,
  syncToApi,
  delay = 2000,
  onError,
}: UseDebouncedReorderOptions) {
  // Store the latest data to sync - persists across renders
  const latestDataRef = useRef<ReorderItem[] | null>(null);
  const isSyncingRef = useRef(false);
  
  // Store callbacks in refs to avoid recreating debounce
  const syncToApiRef = useRef(syncToApi);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    syncToApiRef.current = syncToApi;
    onErrorRef.current = onError;
  }, [syncToApi, onError]);

  // Create debounced function ONCE with stable reference
  const debouncedSyncRef = useRef(
    debounce(async () => {
      const data = latestDataRef.current;
      if (!data) return;

      isSyncingRef.current = true;
      try {
        await syncToApiRef.current(data);
        // Clear only if this data was synced
        if (latestDataRef.current === data) {
          latestDataRef.current = null;
        }
      } catch (error) {
        console.error("Failed to sync reorder to API:", error);
        onErrorRef.current?.(error);
      } finally {
        isSyncingRef.current = false;
      }
    }, delay)
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSyncRef.current.cancel();
    };
  }, []);

  // Main reorder function - stable reference
  const reorder = useCallback((data: ReorderItem[]) => {
    // Always update cache immediately
    updateCache(data);

    // Store latest data
    latestDataRef.current = data;

    // Trigger debounced sync - resets timer on each call
    debouncedSyncRef.current();
  }, [updateCache]);

  // Cancel pending sync
  const cancel = useCallback(() => {
    debouncedSyncRef.current.cancel();
    latestDataRef.current = null;
  }, []);

  // Flush pending sync immediately
  const flush = useCallback(() => {
    debouncedSyncRef.current.flush();
  }, []);

  return {
    reorder,
    cancel,
    flush,
    get isPending() {
      return latestDataRef.current !== null;
    },
    get isSyncing() {
      return isSyncingRef.current;
    },
  };
}
