import { PaginationMeta } from "./types";

export type User = {
  id: string;
  name: string;
  email: string;
  thread_id?: string | null;
  model_access?: ModelAccess[];
  role: UserRole;
  is_default_admin?: boolean;
  user_preferences?: {
    enhance_prompts?: boolean;
  };
  active_team_id: string;
};

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: UserRole;
  status: UserStatus;
  invitation_link?: string;
  is_default_admin?: boolean;
  content_filter_disabled?: boolean;
  brand_access?: {
    id: string;
    name: string;
    created_by: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  model_access?: ModelAccess[];
};
export type ModelAccess = {
  id: string;
  name: string;
  type: string;
};
export type UserListResponse = {
  users: UserListItem[];
  pagination: PaginationMeta;
};

export enum UserRoleId {
  ADMIN = "KK-ADMIN",
  USER = "KK-USER",
  KK_CREATIVE_USER = "KK-CREATIVE-USER",
}

export type UserRole = {
  id: UserRoleId;
  name: string;
  permissions: string[];
};

export enum UserStatus {
  ACTIVE = "active",
  INVITED = "invited",
}

export type UserBrand = {
  id: string;
  name: string;
  campaigns: {
    id: string;
    title: string;
    is_archived?: boolean;
    position?: number;
    is_custom?: boolean;
  }[];
  created_by: {
    id: string;
    name: string;
    email: string;
  };
};
