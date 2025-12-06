import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchAllUsers } from "@/services/api/user.service";
import type { UserListResponse } from "@/types/user.types";

const USERS_PER_PAGE = 10;

interface UseUsersInfiniteOptions {
  search?: string;
  enabled?: boolean;
  excludeIds?: string[];
}

export function getUsersInfiniteQueryKey(search?: string) {
  return ["users-infinite", search];
}

export function useUsersInfinite({
  search,
  enabled = true,
  excludeIds = [],
}: UseUsersInfiniteOptions = {}) {
  const query = useInfiniteQuery<UserListResponse | null>({
    queryKey: getUsersInfiniteQueryKey(search),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchAllUsers(
        pageParam as number,
        USERS_PER_PAGE,
        search
      );
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination.has_next) return undefined;
      // Calculate next page number
      const currentPage =
        Math.floor(lastPage.pagination.skip / USERS_PER_PAGE) + 1;
      return currentPage + 1;
    },
    initialPageParam: 1,
    enabled,
  });

  // Flatten all pages of users and filter out excluded IDs
  const users =
    query.data?.pages
      .flatMap((page) => page?.users ?? [])
      .filter((user) => !excludeIds.includes(user.id)) ?? [];

  const totalUsers = query.data?.pages[0]?.pagination.total ?? 0;

  return {
    users,
    totalUsers,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export default useUsersInfinite;
