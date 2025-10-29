import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

type UseInfiniteScrollOptions<T> = {
  items: T[];
  itemsPerPage?: number;
  onLoadMore?: () => void;
  loadingDelay?: number; // Delay in ms to simulate loading
};

type UseInfiniteScrollReturn<T> = {
  displayedItems: T[];
  sentinelRef: (node?: Element | null) => void; // Changed to function for useInView
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  reset: () => void;
};

const DEFAULT_ITEMS_PER_PAGE = 20;
const DEFAULT_LOADING_DELAY = 300; // 300ms delay to simulate loading

/**
 * Custom hook for infinite scroll pagination using Intersection Observer
 * Displays items in chunks and loads more when user scrolls near the bottom
 * Includes a loading state for better UX
 */
export function useInfiniteScroll<T>({
  items,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  onLoadMore,
  loadingDelay = DEFAULT_LOADING_DELAY,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const hasMore = currentPage < totalPages;
  const displayedItems = items.slice(0, currentPage * itemsPerPage);

  // Use react-intersection-observer for better control
  const { ref: sentinelRef, inView } = useInView({
    rootMargin: "0px", // Start loading before reaching the absolute bottom
    threshold: 1,
  });

  // Handle loading more items when sentinel is in view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setIsLoading(true);
      // Simulate loading delay for better UX
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        onLoadMore?.();
        setIsLoading(false);
      }, loadingDelay);
    }
  }, [inView, hasMore, isLoading, loadingDelay, onLoadMore]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setIsLoading(false);
  }, []);

  return {
    displayedItems,
    sentinelRef,
    hasMore,
    currentPage,
    totalPages,
    isLoading,
    reset,
  };
}
