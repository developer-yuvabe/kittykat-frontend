import { useInfiniteQuery } from "@tanstack/react-query";
import { listTeams } from "@/services/api/team.service";
import type { TeamsListResponse } from "@/types/team.types";

const TEAMS_PER_PAGE = 10;

interface UseTeamsInfiniteOptions {
  search?: string;
  enabled?: boolean;
}

export function getTeamsInfiniteQueryKey(search?: string) {
  return ["teams-infinite", search];
}

export function useTeamsInfinite({
  search,
  enabled = true,
}: UseTeamsInfiniteOptions = {}) {
  const query = useInfiniteQuery<TeamsListResponse>({
    queryKey: getTeamsInfiniteQueryKey(search),
    queryFn: async ({ pageParam = 0 }) => {
      return listTeams(pageParam as number, TEAMS_PER_PAGE, search);
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextSkip = allPages.length * TEAMS_PER_PAGE;
      return nextSkip < lastPage.total ? nextSkip : undefined;
    },
    initialPageParam: 0,
    enabled,
  });

  const teams = query.data?.pages.flatMap((page) => page.teams) ?? [];
  const totalTeams = query.data?.pages[0]?.total ?? 0;

  return {
    teams,
    totalTeams,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export default useTeamsInfinite;
