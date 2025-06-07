export type User = {
  id: string;
  name: string;
  email: string;
  thread_id?: string;
  brand_access: UserBrand[];
  role: UserRole;
};

type UserRole = {
  id: string;
  name: string;
  permissions: string[];
};

export type UserBrand = {
  id: string;
  name: string;
  created_by: string;
};
