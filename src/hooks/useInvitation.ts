// src/hooks/useInvitation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inviteUserToPlatform,
  inviteUserToTeam,
  createInvitation,
  resendInvitation,
  acceptPlatformInvitation,
  acceptTeamInvitation,
  cancelInvitation,
  validateTeamInvitation,
  type TeamInvitationCreateInput,
  type InvitationCreateInput,
  type TeamInvitationValidationResponse,
} from "@/services/api/invitation.service";
import type { InvitationInput } from "@/schema/inviation.schema";
import { getTeamQueryKey, getMyTeamsQueryKey } from "./useTeams";

// ============================================================================
// Query Keys
// ============================================================================
export const invitationKeys = {
  all: ["invitations"] as const,
  detail: (id: string) => ["invitations", id] as const,
  teamValidation: (teamId: string) =>
    ["invitations", "team", teamId, "validate"] as const,
};

// ============================================================================
// Hook
// ============================================================================
export function useInvitation() {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Platform Invitation Mutations
  // -------------------------------------------------------------------------
  const inviteToPlatformMutation = useMutation({
    mutationFn: (data: InvitationInput) => inviteUserToPlatform(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  // -------------------------------------------------------------------------
  // Team Invitation Mutations
  // -------------------------------------------------------------------------
  const inviteToTeamMutation = useMutation({
    mutationFn: (data: TeamInvitationCreateInput) => inviteUserToTeam(data),
    onSuccess: (_, variables) => {
      // Invalidate team queries to reflect new member
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(variables.teamId),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  // -------------------------------------------------------------------------
  // Generic Invitation Mutation (supports both flows)
  // -------------------------------------------------------------------------
  const createInvitationMutation = useMutation({
    mutationFn: (data: InvitationCreateInput) => createInvitation(data),
    onSuccess: (_, variables) => {
      if (variables.teamId) {
        queryClient.invalidateQueries({
          queryKey: getTeamQueryKey(variables.teamId),
        });
        queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
        queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
      }
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  // -------------------------------------------------------------------------
  // Resend Invitation
  // -------------------------------------------------------------------------
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => resendInvitation(invitationId),
  });

  // -------------------------------------------------------------------------
  // Accept Platform Invitation (new users)
  // -------------------------------------------------------------------------
  const acceptPlatformInvitationMutation = useMutation({
    mutationFn: ({
      invitationId,
      firebaseUid,
      name,
    }: {
      invitationId: string;
      firebaseUid: string;
      name: string;
    }) => acceptPlatformInvitation(invitationId, firebaseUid, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  // -------------------------------------------------------------------------
  // Accept Team Invitation (existing users)
  // -------------------------------------------------------------------------
  const acceptTeamInvitationMutation = useMutation({
    mutationFn: (teamId: string) => acceptTeamInvitation(teamId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: getTeamQueryKey(data.team_id),
      });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
      queryClient.invalidateQueries({ queryKey: getMyTeamsQueryKey() });
    },
  });

  // -------------------------------------------------------------------------
  // Cancel Invitation
  // -------------------------------------------------------------------------
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["teams"], exact: false });
    },
  });

  return {
    // Platform invitation
    inviteToPlatform: inviteToPlatformMutation.mutateAsync,
    isInvitingToPlatform: inviteToPlatformMutation.isPending,
    inviteToPlatformError: inviteToPlatformMutation.error,

    // Team invitation
    inviteToTeam: inviteToTeamMutation.mutateAsync,
    isInvitingToTeam: inviteToTeamMutation.isPending,
    inviteToTeamError: inviteToTeamMutation.error,

    // Generic invitation
    createInvitation: createInvitationMutation.mutateAsync,
    isCreatingInvitation: createInvitationMutation.isPending,
    createInvitationError: createInvitationMutation.error,

    // Resend
    resendInvitation: resendInvitationMutation.mutate,
    isResendingInvitation: resendInvitationMutation.isPending,

    // Accept platform invitation
    acceptPlatformInvitation: acceptPlatformInvitationMutation.mutate,
    isAcceptingPlatformInvitation: acceptPlatformInvitationMutation.isPending,

    // Accept team invitation
    acceptTeamInvitation: acceptTeamInvitationMutation.mutateAsync,
    isAcceptingTeamInvitation: acceptTeamInvitationMutation.isPending,

    // Cancel
    cancelInvitation: cancelInvitationMutation.mutate,
    isCancellingInvitation: cancelInvitationMutation.isPending,
  };
}

// ============================================================================
// Team Invitation Validation Hook
// ============================================================================
interface UseTeamInvitationValidationOptions {
  teamId: string;
  enabled?: boolean;
}

export function useTeamInvitationValidation({
  teamId,
  enabled = true,
}: UseTeamInvitationValidationOptions) {
  const validationQuery = useQuery<TeamInvitationValidationResponse>({
    queryKey: invitationKeys.teamValidation(teamId),
    queryFn: () => validateTeamInvitation(teamId),
    enabled: enabled && !!teamId,
    retry: false,
  });

  return {
    validation: validationQuery.data,
    isValidating: validationQuery.isLoading,
    validationError: validationQuery.error,
    isValid: validationQuery.data?.is_valid ?? false,
    isAlreadyMember: validationQuery.data?.is_already_member ?? false,
    status: validationQuery.data?.status,
    teamName: validationQuery.data?.team_name,
  };
}

export default useInvitation;
