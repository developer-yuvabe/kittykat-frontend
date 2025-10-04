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
  | "draft"
  | "request_created"
  | "in_progress"
  | "in_review"
  | "approved"
  | "requested_revision"
  | "a2i_media_created";

export interface AdjustmentLog {
  reason: string;
  adjusted_by: string;
  adjusted_at: string;
  adjusted_credit: number;
}

export interface TasklistRecord {
  id?: string;
  asset_ids: string[]; // Array of asset IDs (single: [id], bulk: [id1, id2, ...])
  brand_id: string;
  campaign_id?: string;
  asset_urls: string[]; // Array of asset URLs (single: [url], bulk: [url1, url2, ...])
  submitted_by: string;
  submitted_at: string;
  submitted_by_name?: string;
  initial_deduction_credits: number;
  estimated_credits: number;
  final_credits: number;
  tasks: Task[];
  adjustment_logs: AdjustmentLog[];
  notes?: string;
  brand_name?: string;
  campaign_name?: string;
  audit_logs: any[];
  asset_expert_status?: TasklistStatus;
  is_bulk_request?: boolean; // New: Flag to indicate bulk tasklist
}

export interface CreateTasklistRequest {
  asset_ids: string[]; // Array of asset IDs (single: [id], bulk: [id1, id2, ...])
  brand_id: string;
  campaign_id?: string;
  asset_urls: string[]; // Array of asset URLs (single: [url], bulk: [url1, url2, ...])
  submitted_by: string;
  tasks?: Task[]; // Optional for bulk requests (manual generation)
  notes?: string;
  submitted_by_name?: string;
  brand_name?: string;
  campaign_name?: string;
  is_bulk_request?: boolean; // Flag to indicate bulk tasklist
}

export interface UpdateTasklistRequest {
  asset_expert_status?: TasklistStatus;
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

export interface TimelineEvent {
  type: "created" | "updated" | "credit_adjusted";
  timestamp: string;
  user_id: string;
  details: {
    // For 'created' events
    estimated_credits?: number;
    initial_deduction?: number;
    // For 'updated' events
    status_changed_to?: string;
    // For 'credit_adjusted' events
    adjustment?: number;
    reason?: string;
  };
}

export interface TasklistDetailResponse {
  tasklist: TasklistRecord;
}

export interface TasklistTimelineResponse {
  timeline: TimelineEvent[];
  total_events: number;
}

export interface TasklistFilters {
  brand_ids?: string[];
  campaign_ids?: string[];
  asset_expert_statuses?: TasklistStatus[];
  submitted_by?: string;
  date_from?: string; // ISO 8601 datetime string
  date_to?: string; // ISO 8601 datetime string
  search?: string;
  page?: number;
  page_size?: number;
  brand_name?: string;
  campaign_name?: string;
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
