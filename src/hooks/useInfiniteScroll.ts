import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions<T> = {
  items: T[];
  itemsPerPage?: number;
  onLoadMore?: () => void;
};

type UseInfiniteScrollReturn<T> = {
  displayedItems: T[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  reset: () => void;
};

const DEFAULT_ITEMS_PER_PAGE = 20;

/**
 * Custom hook for infinite scroll pagination using Intersection Observer
 * Displays items in chunks and loads more when user scrolls near the bottom
 */
export function useInfiniteScroll<T>({
  items,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  onLoadMore,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const hasMore = currentPage < totalPages;
  const displayedItems = items.slice(0, currentPage * itemsPerPage);

  // Setup Intersection Observer for sentinel element
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Check if sentinel is visible in viewport
        if (entries[0]?.isIntersecting && hasMore) {
          setCurrentPage((prev) => prev + 1);
          onLoadMore?.();
        }
      },
      {
        root: null,
        rootMargin: "100px", // Start loading before reaching the absolute bottom
        threshold: 0,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, onLoadMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    displayedItems,
    sentinelRef,
    hasMore,
    currentPage,
    totalPages,
    reset,
  };
}
