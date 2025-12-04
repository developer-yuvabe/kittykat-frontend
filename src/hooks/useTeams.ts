import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createTeam,
  getTeam,
  listTeams,
  updateTeam as updateTeamService,
  deleteTeam as deleteTeamService,
  addMembers as addMemberService,
  removeMembers as removeMemberService,
  updateMemberRole as updateMemberRoleService,
  getTeamBrands as getTeamBrandsService,
  getMyTeamNames,
} from "@/services/api/team.service";

import type {
  TeamCreateRequest,
  TeamUpdateRequest,
  TeamRolesEnum,
} from "@/types/team.types";

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
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["teams"], exact: false });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => deleteTeamService(teamId),
    onSuccess: (_, teamId) => {
      queryClient.removeQueries({ queryKey: getTeamQueryKey(teamId) });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: ({
      teamId,
      members,
    }: {
      teamId: string;
      members: { id: string; role?: TeamRolesEnum }[];
    }) => addMemberService(teamId, members),
    onSuccess: (_, variables) => {
      // Refetch team and team lists to reflect membership changes
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
    },
  });

  const removeMembersMutation = useMutation({
    mutationFn: ({
      teamId,
      memberIds,
    }: {
      teamId: string;
      memberIds: string[];
    }) => removeMemberService(teamId, memberIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({
      teamId,
      memberId,
      newRole,
    }: {
      teamId: string;
      memberId: string;
      newRole: TeamRolesEnum;
    }) => updateMemberRoleService(teamId, memberId, newRole),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<any>(
        getTeamQueryKey(variables.teamId)
      );

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData(getTeamQueryKey(variables.teamId), {
          ...previousData,
          members: previousData.members.map((member: any) =>
            member.id === variables.memberId
              ? { ...member, role: variables.newRole }
              : member
          ),
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(
          getTeamQueryKey(context.previousData.id),
          context.previousData
        );
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
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

    addMembers: addMembersMutation.mutate,
    isAddingMembers: addMembersMutation.isPending,

    removeMembers: removeMembersMutation.mutate,
    isRemovingMembers: removeMembersMutation.isPending,

    updateMemberRole: updateMemberRoleMutation.mutate,
    isUpdatingMemberRole: updateMemberRoleMutation.isPending,
  };
}
