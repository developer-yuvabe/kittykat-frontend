export interface TeamMember {
  id: string;
  role?: string;
}

export interface TeamCreateRequest {
  name: string;
  credits?: number;
  tokens?: number;
  members?: TeamMember[];
  brands?: string[];
}

export interface TeamUpdateRequest {
  name?: string;
  credits?: number | null;
  tokens?: number | null;
  members?: TeamMember[];
  brands?: string[];
}

export interface TeamResponse {
  id: string;
  name: string;
  owner_id: string;
  role?: string | null;
  credits: number;
  tokens: number;
  members?: Array<Record<string, any>> | null;
  brands?: Array<Record<string, any>> | null;
  created_at: string;
  updated_at: string;
}

export interface TeamsListResponse {
  teams: TeamResponse[];
  total: number;
  skip?: number;
  limit?: number;
}

export interface TeamName {
  id: string;
  name: string;
}

export interface TeamNamesListResponse {
  teams: TeamName[];
}
