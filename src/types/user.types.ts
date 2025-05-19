export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export interface UserBase {
  email: string;
  name?: string;
  metadata?: Record<string, any>;
  preferences?: Record<string, any>;
  user_interaction?: Record<string, any>[];
}

export interface UserCreate extends UserBase {
  firebase_uid: string;
  role_id?: string;
  brand_ids?: string[];
  status?: UserStatus;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  status?: UserStatus;
  role_id?: string;
  brand_ids?: string[];
  metadata?: Record<string, any>;
  preferences?: Record<string, any>;
  user_interaction?: Record<string, any>[];
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  //   permissions: Permission[];
}

export interface UserResponse extends UserBase {
  id: string;
  brand_ids: string[];
  onboarding_completed: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends UserResponse {
  // The role property would typically be here, but you've commented it out in your model
  role?: UserRole;
}

export interface UsersListResponse {
  users: UserResponse[];
  pagination: Record<string, any>;
}

export interface PresignedURLRequest {
  file_name: string;
  content_type: string;
}

export interface PresignedURLResponse {
  upload_url: string;
  download_url: string;
}
