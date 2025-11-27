import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createTeam,
  getTeam,
  listTeams,
  updateTeam as updateTeamService,
  deleteTeam as deleteTeamService,
  addMember as addMemberService,
  removeMember as removeMemberService,
  getTeamBrands as getTeamBrandsService,
  getMyTeamNames,
} from "@/services/api/team.service";

import type { TeamCreateRequest, TeamUpdateRequest } from "@/types/team.types";

interface UseTeamsOptions {
  teamId?: string;
  skip?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function getTeamQueryKey(teamId?: string) {
  return ["team", teamId];
}

export function getTeamsListQueryKey(
  skip?: number,
  limit?: number,
  search?: string
) {
  return ["teams", "list", skip, limit, search];
}

export function getTeamBrandsQueryKey(teamId?: string) {
  return ["teams", "brands", teamId];
}

export function getMyTeamsQueryKey() {
  return ["teams", "me"];
}

export function useTeams({
  teamId,
  skip = 0,
  limit = 10,
  search,
  enabled = true,
}: UseTeamsOptions = {}) {
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: getTeamQueryKey(teamId),
    queryFn: () => getTeam(teamId!),
    enabled: enabled && !!teamId,
  });

  const teamsListQuery = useQuery({
    queryKey: getTeamsListQueryKey(skip, limit, search),
    queryFn: () => listTeams(skip, limit, search),
    enabled,
  });

  const teamBrandsQuery = useQuery({
    queryKey: getTeamBrandsQueryKey(teamId),
    queryFn: () => getTeamBrandsService(teamId!),
    enabled: enabled && !!teamId,
  });

  const myTeamsQuery = useQuery({
    queryKey: getMyTeamsQueryKey(),
    queryFn: () => getMyTeamNames(),
    enabled,
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (payload: TeamCreateRequest) => createTeam(payload),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["teams"], exact: false });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: string;
      payload: TeamUpdateRequest;
    }) => updateTeamService(teamId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(getTeamQueryKey(variables.teamId), data);
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => deleteTeamService(teamId),
    onSuccess: (_, teamId) => {
      queryClient.removeQueries({ queryKey: getTeamQueryKey(teamId) });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      role,
    }: {
      teamId: string;
      memberId: string;
      role?: string;
    }) => addMemberService(teamId, memberId, role),
    onSuccess: (_, variables) => {
      // Refetch team and team lists to reflect membership changes
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      removeMemberService(teamId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
    },
  });

  return {
    // Queries
    teamQuery,
    teamsListQuery,
    teamBrandsQuery,
    myTeamsQuery,

    // Mutations
    createTeam: createTeamMutation.mutateAsync,
    isCreatingTeam: createTeamMutation.isPending,

    updateTeam: updateTeamMutation.mutate,
    isUpdatingTeam: updateTeamMutation.isPending,

    deleteTeam: deleteTeamMutation.mutate,
    isDeletingTeam: deleteTeamMutation.isPending,

    addMember: addMemberMutation.mutate,
    isAddingMember: addMemberMutation.isPending,

    removeMember: removeMemberMutation.mutate,
    isRemovingMember: removeMemberMutation.isPending,
  };
}
