export type User = {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
  brand_ids: string[];
};

export interface BaseApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
}
