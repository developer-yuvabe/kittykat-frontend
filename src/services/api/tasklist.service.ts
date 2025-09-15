import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";
import { Comment } from "@/types/gallery.types";

// --- Interfaces ---
export interface Task {
  task: string;
  task_category: string;
  estimated_credit: number;
}

export interface TaskListGenerateRequest {
  image_url: string;
  comments: Comment[];
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
}

export interface UpdateTasklistRequest {
  status?: TasklistStatus;
  notes?: string;
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

class TaskListService {
  /** Generate a deduplicated task list from image comments */
  async generateTaskList(
    image_url: string,
    comments: Comment[]
  ): Promise<TaskListGenerateResponse> {
    const request: TaskListGenerateRequest = { image_url, comments };
    return await handleApiRequest<TaskListGenerateResponse>(
      axiosInstance.post("/ask-kittykat/tasklist/generate", request)
    );
  }

  /** Get the complete price list of task categories and their credit costs */
  async getTaskPriceList(): Promise<PriceListResponse> {
    return await handleApiRequest<PriceListResponse>(
      axiosInstance.get("/ask-kittykat/tasklist/pricelist")
    );
  }

  /** Create a new tasklist record */
  async createTasklist(
    request: CreateTasklistRequest
  ): Promise<TasklistRecord> {
    return await handleApiRequest<TasklistRecord>(
      axiosInstance.post("/ask-kittykat/tasklists", request)
    );
  }

  /** Get a paginated list of tasklists with filtering capabilities */
  async listTasklists(filters: TasklistFilters): Promise<TasklistListResponse> {
    return await handleApiRequest<TasklistListResponse>(
      axiosInstance.get("/ask-kittykat/tasklists", { params: filters })
    );
  }

  /** Get detailed information about a specific tasklist */
  async getTasklistDetail(
    tasklist_id: string
  ): Promise<TasklistDetailResponse> {
    return await handleApiRequest<TasklistDetailResponse>(
      axiosInstance.get(`/ask-kittykat/tasklists/${tasklist_id}`)
    );
  }

  /** Update a tasklist (admin use) */
  async updateTasklist(
    tasklist_id: string,
    request: UpdateTasklistRequest,
    user_id: string
  ): Promise<TasklistRecord> {
    return await handleApiRequest<TasklistRecord>(
      axiosInstance.patch(`/ask-kittykat/tasklists/${tasklist_id}`, request, {
        params: { user_id },
      })
    );
  }

  /** Adjust credits for a tasklist (admin only) */
  async adjustTasklistCredits(
    tasklist_id: string,
    request: AdjustCreditsRequest
  ): Promise<TasklistRecord> {
    return await handleApiRequest<TasklistRecord>(
      axiosInstance.patch(
        `/ask-kittykat/tasklists/${tasklist_id}/adjust-credits`,
        request
      )
    );
  }

  /** Delete a tasklist (admin only) */
  async deleteTasklist(
    tasklist_id: string,
    user_id: string
  ): Promise<{ deleted: boolean; tasklist_id: string }> {
    return await handleApiRequest<{ deleted: boolean; tasklist_id: string }>(
      axiosInstance.delete(`/ask-kittykat/tasklists/${tasklist_id}`, {
        params: { user_id },
      })
    );
  }

  /** Get the timeline of events for a specific tasklist */
  async getTasklistTimeline(
    tasklist_id: string
  ): Promise<{ timeline: any[]; total_events: number }> {
    return await handleApiRequest<{ timeline: any[]; total_events: number }>(
      axiosInstance.get(`/ask-kittykat/tasklists/${tasklist_id}/timeline`)
    );
  }

  /** Get statistics for tasklists by brand */
  async getBrandTasklistStats(brand_id: string): Promise<any> {
    return await handleApiRequest<any>(
      axiosInstance.get(`/ask-kittykat/brands/${brand_id}/tasklist-stats`)
    );
  }

  /** Export tasklists to CSV format with filtering */
  async exportTasklistsCsv(filters: TasklistFilters): Promise<Blob> {
    const response = await axiosInstance.get(
      "/ask-kittykat/tasklists/export/csv",
      {
        params: filters,
        responseType: "blob",
      }
    );
    return response.data;
  }
}

export default new TaskListService();
