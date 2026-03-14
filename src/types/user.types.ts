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

export type Campaign = {
  id: string;
  title: string;
  is_archived?: boolean;
  position?: number;
  is_custom?: boolean;
  is_analyzing?: boolean;
  is_curated_for_brand?: boolean;
  is_admin_only?: boolean; //for hidden folders
  is_kk_folder?: boolean; //for kk folders
  is_kk_selected?: boolean; //for kk folders
  sub_folders?: {
    id: string;
    name: string;
    is_admin_only?: boolean; //for hidden folders
    is_kk_folder?: boolean; //for kk folders
    is_kk_selected?: boolean; //for kk folders
  }[];
};

export type UserBrand = {
  id: string;
  name: string;
  campaigns: Campaign[];
  created_by: {
    id: string;
    name: string;
    email: string;
  };
};
export interface TokenUsageCsvParams {
  start_date: string;
  end_date: string;
  workspace_id?: string[];
  user_id?: string[];
  brand_id?: string[];
  model_id?: string[];
}
