// src/services/api/team.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import type {
  TeamCreateRequest,
  TeamUpdateRequest,
  TeamResponse,
  TeamsListResponse,
  TeamNamesListResponse,
  TeamRolesEnum,
} from "@/types/team.types";
import { UserBrand } from "@/types/user.types";

export async function createTeam(
  payload: TeamCreateRequest
): Promise<TeamResponse> {
  return handleApiRequest<TeamResponse>(axiosInstance.post(`/teams`, payload));
}

export async function getTeam(teamId: string): Promise<TeamResponse> {
  return handleApiRequest<TeamResponse>(axiosInstance.get(`/teams/${teamId}`));
}

export async function listTeams(
  skip: number = 0,
  limit: number = 10,
  search?: string
): Promise<TeamsListResponse> {
  // Search param as query string
  return handleApiRequest<TeamsListResponse>(
    axiosInstance.get(`/teams`, { params: { skip, limit, search } })
  );
}

export async function updateTeam(
  teamId: string,
  payload: TeamUpdateRequest
): Promise<TeamResponse> {
  return handleApiRequest<TeamResponse>(
    axiosInstance.put(`/teams/${teamId}`, payload)
  );
}

export async function deleteTeam(teamId: string): Promise<void> {
  return handleApiRequest<void>(axiosInstance.delete(`/teams/${teamId}`));
}

export async function addMembers(
  teamId: string,
  members: { id: string; role?: TeamRolesEnum }[]
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(`/teams/${teamId}/members`, { members })
  );
}

export async function removeMembers(
  teamId: string,
  memberIds: string[]
): Promise<void> {
  return handleApiRequest<void>(
    // axios delete with body requires 'data' property in config
    axiosInstance.delete(`/teams/${teamId}/members`, {
      data: { member_ids: memberIds },
    })
  );
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  newRole: TeamRolesEnum
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.patch(`/teams/${teamId}/members/${memberId}/role`, newRole, {
      headers: { "Content-Type": "application/json" },
    })
  );
}

export async function getTeamBrands(teamId: string): Promise<UserBrand[]> {
  return handleApiRequest<UserBrand[]>(
    axiosInstance.get(`/teams/${teamId}/brands`)
  );
}

export async function getMyTeamNames(): Promise<TeamNamesListResponse> {
  return handleApiRequest<TeamNamesListResponse>(
    axiosInstance.get(`/teams/me`)
  );
}
