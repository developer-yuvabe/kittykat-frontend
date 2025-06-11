export type User = {
  id: string;
  name: string;
  email: string;
  thread_id?: string | null;
  brand_access?: UserBrand[];
  role: UserRole;
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
  brand_access?: {
    id: string;
    name: string;
    created_by: {
      id: string;
      name: string;
      email: string;
    };
  }[];
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
  created_by: string;
};
