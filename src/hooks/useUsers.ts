import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createUser,
  updateUser,
  fetchAllUsers,
  deleteUser,
  fetchUserBrands,
  inviteUser,
  resendInvitation,
  acceptInvitation,
  checkIfEmailExists,
  sendEmailVerificationLink,
  updateUserActiveTeam,
  resetUserThread,
} from "@/services/api/user.service";
import type { UserListResponse, UserBrand } from "@/types/user.types";

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  enabled?: boolean;
}

export function getUserQueryKey(userId?: string) {
  return ["user", userId];
}

export function getUsersListQueryKey(
  page?: number,
  limit?: number,
  search?: string,
) {
  return ["users", page, limit, search];
}

export function getUserBrandsQueryKey(userId?: string) {
  return ["users", "brands", userId];
}

export function useUsers({
  page = 1,
  limit = 10,
  search,
  userId,
  enabled = true,
}: UseUsersOptions = {}) {
  const queryClient = useQueryClient();

  // Queries
  const usersListQuery = useQuery<UserListResponse | null>({
    queryKey: getUsersListQueryKey(page, limit, search),
    queryFn: () => fetchAllUsers(page, limit, search),
    enabled,
  });

  const userBrandsQuery = useQuery<UserBrand[] | null>({
    queryKey: getUserBrandsQueryKey(userId),
    queryFn: () => fetchUserBrands(userId!),
    enabled: enabled && !!userId,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (payload: { uid: string; email: string; name: string }) =>
      createUser(payload),
    onSuccess: () => {
      // Invalidate users lists so UI updates with the new user
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: any }) =>
      updateUser(userId, payload),
    onSuccess: (data, variables) => {
      // Update single user query cache and invalidate list queries
      queryClient.setQueryData(getUserQueryKey(variables.userId), data);
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const updateActiveTeamMutation = useMutation({
    mutationFn: ({
      userId,
      active_team_id,
    }: {
      userId: string;
      active_team_id: string | null;
    }) => updateUserActiveTeam(userId, active_team_id),
    onSuccess: (data, variables) => {
      // Update the single user cache and invalidate lists
      queryClient.setQueryData(getUserQueryKey(variables.userId), data);
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const resetThreadMutation = useMutation({
    mutationFn: (userId: string) => resetUserThread(userId),
    onSuccess: (data, userId) => {
      queryClient.setQueryData(getUserQueryKey(userId), data);
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (_, userId) => {
      queryClient.removeQueries({ queryKey: getUserQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: (payload: any) => inviteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => resendInvitation(invitationId),
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: ({ invitationId, firebase_uid, name }: any) =>
      acceptInvitation(invitationId, firebase_uid, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });

  const checkEmailMutation = useMutation({
    mutationFn: (email: string) => checkIfEmailExists(email),
  });

  const sendEmailVerificationMutation = useMutation({
    mutationFn: (email: string) => sendEmailVerificationLink(email),
    onSuccess: () => {
      // No cache update needed
    },
  });

  return {
    // Queries
    usersListQuery,
    userBrandsQuery,

    // Mutations
    createUser: createUserMutation.mutateAsync,
    isCreatingUser: createUserMutation.isPending,

    updateUser: updateUserMutation.mutate,
    isUpdatingUser: updateUserMutation.isPending,

    deleteUser: deleteUserMutation.mutate,
    isDeletingUser: deleteUserMutation.isPending,

    inviteUser: inviteUserMutation.mutateAsync,
    isInvitingUser: inviteUserMutation.isPending,

    resendInvitation: resendInvitationMutation.mutate,
    isResendingInvitation: resendInvitationMutation.isPending,

    acceptInvitation: acceptInvitationMutation.mutate,
    isAcceptingInvitation: acceptInvitationMutation.isPending,

    checkIfEmailExists: checkEmailMutation.mutateAsync,
    isCheckingEmail: checkEmailMutation.isPending,

    sendEmailVerificationLink: sendEmailVerificationMutation.mutate,
    isSendingEmailVerificationLink: sendEmailVerificationMutation.isPending,
    updateActiveTeamAsync: updateActiveTeamMutation.mutateAsync,
    isUpdatingActiveTeam: updateActiveTeamMutation.isPending,

    resetThread: resetThreadMutation.mutateAsync,
    isResettingThread: resetThreadMutation.isPending,
  };
}

export default useUsers;
