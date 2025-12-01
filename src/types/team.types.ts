export enum TeamRolesEnum {
  OWNER = "TEAM-OWNER",
  MEMBER = "TEAM-MEMBER",
  ADMIN = "TEAM-ADMIN",
}

export interface TeamMember {
  id: string;
  role?: TeamRolesEnum;
  name?: string;
  email?: string;
  consumed_credits?: number;
  consumed_tokens?: number;
}

export interface TeamCreateRequest {
  name: string;
  credits?: number;
  tokens?: number;
  members?: TeamMember[];
  accessible_brands?: string[];
}

export interface TeamUpdateRequest {
  name?: string;
  credits?: number | null;
  tokens?: number | null;
  members?: TeamMember[];
  accessible_brands?: string[];
}

export interface TeamResponse {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  credits: number;
  tokens: number;
  members: TeamMember[];
  accessible_brands?: string[];
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
