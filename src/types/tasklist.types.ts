import { Comment } from "@/types/gallery.types";

export interface Task {
  task: string;
  task_category: string;
  estimated_credit: number;
}

export interface TaskListGenerateRequest {
  image_url: string;
  comments: Comment[];
  enhance?: boolean;
  existing_tasks?: Task[];
}

export interface TaskListGenerateResponse {
  tasks: Task[];
  total_estimated_credits: number;
  imageUrl: string;
}

export interface TaskCategoryPrice {
  category: string;
  description: string;
  credit_cost: number;
}

export interface PriceListResponse {
  categories: TaskCategoryPrice[];
  total_categories: number;
}

export type TasklistStatus =
  | "estimated"
  | "deducted"
  | "adjusted"
  | "finalized"
  | "completed";

export interface AdjustmentLog {
  reason: string;
  adjusted_by: string;
  adjusted_at: string;
  adjusted_credit: number;
}

export interface TasklistRecord {
  _id?: string;
  id?: string;
  image_id: string;
  brand_id: string;
  campaign_id?: string;
  asset_url: string;
  submitted_by: string;
  submitted_at: string;
  submitted_by_name?: string;
  status: TasklistStatus;
  initial_deduction_credits: number;
  estimated_credits: number;
  final_credits: number;
  tasks: Task[];
  adjustment_logs: AdjustmentLog[];
  notes?: string;
  audit_logs: any[];
}

export interface CreateTasklistRequest {
  image_id: string;
  brand_id: string;
  campaign_id?: string;
  asset_url: string;
  submitted_by: string;
  tasks: Task[];
  notes?: string;
  submitted_by_name?: string;
}

export interface UpdateTasklistRequest {
  status?: TasklistStatus;
  notes?: string;
  log?: string;
}

export interface AdjustCreditsRequest {
  credit_adjustment: number;
  reason: string;
  adjusted_by: string;
}

export interface TasklistListResponse {
  tasklists: TasklistRecord[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface TasklistDetailResponse {
  tasklist: TasklistRecord;
  timeline: any[];
}

export interface TasklistFilters {
  brand_id?: string;
  campaign_id?: string;
  status?: TasklistStatus;
  submitted_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TaskCreditEstimateRequest {
  task: string;
  image_url?: string;
}

export interface TaskCreditEstimateResponse {
  task: string;
  task_category: string;
  estimated_credit: number;
  category_description: string;
}
