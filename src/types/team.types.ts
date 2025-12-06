export enum TeamRolesEnum {
  OWNER = "TEAM-OWNER",
  MEMBER = "TEAM-MEMBER",
  ADMIN = "TEAM-ADMIN",
}

// ============================================================================
// Team Member Status
// ============================================================================
export enum TeamMemberStatus {
  ACTIVE = "active",
  INVITED = "invited",
}

// ============================================================================
// Team Member Types
// ============================================================================
export interface TeamMember {
  id: string;
  role?: TeamRolesEnum;
  name?: string;
  email?: string;
  status?: TeamMemberStatus;
  consumed_credits?: number;
  consumed_tokens?: number;
  invitation_link?: string;
}

export interface TeamBrand {
  id: string;
  name: string;
}

// ============================================================================
// Team Invitation Types
// ============================================================================
export interface TeamInvitationRequest {
  email: string;
  teamId: string;
  teamRole?: TeamRolesEnum;
  // Platform role for new users
  role?: string;
  modelAccess?: string[];
  contentFilterDisabled?: boolean;
  credits?: number;
  tokens?: number;
}

export interface TeamInvitationResponse {
  id: string;
  email?: string;
  role: TeamRolesEnum;
  status: TeamMemberStatus;
  invitation_link?: string;
  name?: string;
}

export interface TeamInvitationAcceptRequest {
  teamId: string;
}

// ============================================================================
// Team Request/Response Types
// ============================================================================

export interface TeamCreateRequest {
  name: string;
  credits?: number;
  tokens?: number;
  members?: TeamMember[];
  accessible_brands?: string[];
  has_all_brands_access?: boolean;
}

export interface TeamUpdateRequest {
  name?: string;
  credits?: number | null;
  tokens?: number | null;
  members?: TeamMember[];
  accessible_brands?: string[];
  has_all_brands_access?: boolean;
  avatar_url?: string | null;
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
  accessible_brands?: TeamBrand[];
  created_at: string;
  updated_at: string;
  has_all_brands_access?: boolean;
  is_personal_team: boolean;
  avatar_url?: string;
}

// List API specific response type
export interface TeamListResponse {
  id: string;
  name: string;
  role?: string;
  credits: number;
  tokens: number;
  members_count: number;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  brands_count: number;
  created_at: string;
  updated_at: string;
  is_personal_team: boolean;
  avatar_url?: string;
}

export interface TeamsListResponse {
  teams: TeamListResponse[];
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
