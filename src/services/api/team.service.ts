// src/services/api/team.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import type {
  TeamCreateRequest,
  TeamUpdateRequest,
  TeamResponse,
  TeamsListResponse,
  TeamNamesListResponse,
} from "@/types/team.types";

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

export async function addMember(
  teamId: string,
  memberId: string,
  role?: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.post(`/teams/${teamId}/members`, undefined, {
      params: { member_id: memberId, role },
    })
  );
}

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<void> {
  return handleApiRequest<void>(
    axiosInstance.delete(`/teams/${teamId}/members/${memberId}`)
  );
}

export async function getTeamBrands(teamId: string): Promise<any[]> {
  return handleApiRequest<any[]>(axiosInstance.get(`/teams/${teamId}/brands`));
}

export async function getMyTeamNames(): Promise<TeamNamesListResponse> {
  return handleApiRequest<TeamNamesListResponse>(
    axiosInstance.get(`/teams/me`)
  );
}
