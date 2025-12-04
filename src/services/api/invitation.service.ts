// src/services/api/invitation.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import type { InvitationInput } from "@/schema/inviation.schema";
import type { TeamInvitationResponse, TeamRolesEnum } from "@/types/team.types";
import type { UserListItem } from "@/types/user.types";

// ============================================================================
// Types
// ============================================================================
export interface InvitationCreatePayload {
  email: string;
  role: string;
  model_access: string[];
  base_url: string;
  content_filter_disabled: boolean;
  team_id?: string;
  team_role?: TeamRolesEnum;
  credits?: number;
  tokens?: number;
}

export interface TeamInvitationCreateInput {
  email: string;
  teamId: string;
  teamRole?: TeamRolesEnum;
  role?: string;
  modelAccess?: string[];
  contentFilterDisabled?: boolean;
}

export interface InvitationCreateInput {
  email: string;
  role: string;
  modelAccess: string[];
  contentFilterDisabled: boolean;
  teamId?: string;
  teamRole?: TeamRolesEnum;
  credits?: number;
  tokens?: number;
}

export interface TeamInvitationAcceptPayload {
  team_id: string;
}

// Team Invitation Validation Types
export enum TeamInvitationStatus {
  INVITED = "invited",
  ACTIVE = "active",
  NOT_FOUND = "not_found",
  TEAM_NOT_FOUND = "team_not_found",
  ERROR = "error",
}

export interface TeamInvitationValidationResponse {
  team_id: string;
  team_name: string | null;
  is_valid: boolean;
  is_already_member: boolean;
  status: TeamInvitationStatus;
}

// ============================================================================
// Platform Invitation APIs
// ============================================================================

/**
 * Invite a user to the platform (admin-only)
 */
export async function inviteUserToPlatform(
  data: InvitationInput
): Promise<UserListItem> {
  const payload: InvitationCreatePayload = {
    email: data.email,
    role: data.role,
    model_access: data.modelAccess,
    base_url: window.location.origin,
    content_filter_disabled: data.contentFilterDisabled,
  };

  return handleApiRequest<UserListItem>(
    axiosInstance.post("/invitations", payload)
  );
}

/**
 * Invite a user to a team
 * - If user exists on platform: Only adds to team members with status="invited"
 * - If user is new: Creates platform invitation + adds to team members
 */
export async function inviteUserToTeam(
  data: TeamInvitationCreateInput
): Promise<TeamInvitationResponse> {
  const payload: InvitationCreatePayload = {
    email: data.email,
    role: data.role || "KK-USER",
    model_access: data.modelAccess || [],
    base_url: window.location.origin,
    content_filter_disabled: data.contentFilterDisabled || false,
    team_id: data.teamId,
    team_role: data.teamRole,
  };

  return handleApiRequest<TeamInvitationResponse>(
    axiosInstance.post("/invitations", payload)
  );
}

/**
 * Generic invitation creation (supports both platform and team invitations)
 */
export async function createInvitation(
  data: InvitationCreateInput
): Promise<UserListItem | TeamInvitationResponse> {
  const payload: InvitationCreatePayload = {
    email: data.email,
    role: data.role,
    model_access: data.modelAccess,
    base_url: window.location.origin,
    content_filter_disabled: data.contentFilterDisabled,
    team_id: data.teamId,
    team_role: data.teamRole,
    credits: data.credits,
    tokens: data.tokens,
  };

  return handleApiRequest<UserListItem | TeamInvitationResponse>(
    axiosInstance.post("/invitations", payload)
  );
}

// ============================================================================
// Invitation Management APIs
// ============================================================================

/**
 * Resend an invitation email
 */
export async function resendInvitation(invitationId: string): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(`/invitations/${invitationId}/resend`)
  );
}

/**
 * Accept a platform invitation (for new users)
 */
export async function acceptPlatformInvitation(
  invitationId: string,
  firebaseUid: string,
  name: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(`/invitations/${invitationId}/accept`, {
      name,
      firebase_uid: firebaseUid,
    })
  );
}

/**
 * Accept a team invitation (for existing platform users)
 */
export async function acceptTeamInvitation(
  teamId: string
): Promise<{ team_id: string }> {
  return handleApiRequest<{ team_id: string }>(
    axiosInstance.post("/invitations/team/accept", {
      team_id: teamId,
    })
  );
}

/**
 * Get invitation details by ID
 */
export async function getInvitation(
  invitationId: string
): Promise<UserListItem> {
  return handleApiRequest<UserListItem>(
    axiosInstance.get(`/invitations/${invitationId}`)
  );
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.delete(`/invitations/${invitationId}`)
  );
}

/**
 * Validate if a team invitation is valid for the current user
 * - Checks if user has a pending invitation to join the specified team
 * - Returns status: 'invited' | 'active' | 'not_found' | 'team_not_found'
 */
export async function validateTeamInvitation(
  teamId: string
): Promise<TeamInvitationValidationResponse> {
  return handleApiRequest<TeamInvitationValidationResponse>(
    axiosInstance.get(`/invitations/team/${teamId}/validate`)
  );
}
