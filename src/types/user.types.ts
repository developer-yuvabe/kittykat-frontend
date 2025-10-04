import { PaginationMeta } from "./types";

export type User = {
  id: string;
  name: string;
  email: string;
  thread_id?: string | null;
  brand_access?: UserBrand[];
  model_access?: ModelAccess[];
  role: UserRole;
  is_default_admin?: boolean;
  credits?: number;
  kittykat_expert_credits?: number;
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
  credits?: number;
  kittykat_expert_credits?: number;
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
  }[];
  created_by: {
    id: string;
    name: string;
    email: string;
  };
};
