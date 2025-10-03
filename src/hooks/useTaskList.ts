import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import taskListService from "@/services/api/tasklist.service";
import { galleryService } from "@/services/api/gallery.service";
import type {
  TasklistFilters,
  TasklistListResponse,
  TasklistRecord,
  TasklistDetailResponse,
  UpdateTasklistRequest,
  AdjustCreditsRequest,
  CreateTasklistRequest,
  TaskCreditEstimateRequest,
} from "@/types/tasklist.types";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

export const ITEMS_PER_PAGE = 20;

interface UseTaskListProps {
  filters?: TasklistFilters;
  enabled?: boolean;
}

export const useTaskList = ({
  filters = {},
  enabled = true,
}: UseTaskListProps = {}) => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const isAdmin = user?.role.id === UserRoleId.ADMIN;
  // Apply role-based filtering
  const getFiltersWithRoleCheck = (
    inputFilters: TasklistFilters
  ): TasklistFilters => {
    const roleBasedFilters = { ...inputFilters };

    // For non-admin users, backend will handle brand filtering based on auth context
    // No need to modify filters here - the API will automatically restrict data

    return roleBasedFilters;
  };

  // Fetch brands and campaigns for filters
  const brandsQuery = useQuery({
    queryKey: ["brands-campaigns"],
    queryFn: () => galleryService.getBrandsWithCampaigns(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });

  // Generate query key for current filters
  const getTaskListQueryKey = (queryFilters: TasklistFilters) => [
    "tasklists",
    queryFilters.brand_ids?.join(","),
    queryFilters.campaign_ids?.join(","),
    queryFilters.asset_expert_statuses?.join(","),
    queryFilters.submitted_by,
    queryFilters.date_from,
    queryFilters.date_to,
    queryFilters.search,
    queryFilters.page,
    queryFilters.page_size,
  ];

  // Main tasklist query with pagination
  const taskListQuery = useQuery({
    queryKey: getTaskListQueryKey(filters),
    queryFn: async () => {
      const roleBasedFilters = getFiltersWithRoleCheck({
        ...filters,
        page: filters.page || 1,
        page_size: filters.page_size || ITEMS_PER_PAGE,
      });

      try {
        const result = await taskListService.listTasklists(roleBasedFilters);
        if (!result) {
          throw new Error("No data returned from tasklist service");
        }
        return result;
      } catch (error) {
        console.error("Error fetching tasklists:", error);
        throw error;
      }
    },
    enabled: enabled && !!user,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get single tasklist detail
  const useTaskListDetail = (tasklistId: string) => {
    return useQuery({
      queryKey: ["tasklist", tasklistId],
      queryFn: () => taskListService.getTasklistDetail(tasklistId),
      enabled: !!tasklistId && !!user,
      staleTime: 30 * 1000,
    });
  };

  // Get tasklist timeline
  const useTaskListTimeline = (tasklistId: string) => {
    return useQuery({
      queryKey: ["tasklist-timeline", tasklistId],
      queryFn: () => taskListService.getTasklistTimeline(tasklistId),
      enabled: !!tasklistId && !!user,
      staleTime: 30 * 1000,
    });
  };

  // Get task price list
  const usePriceList = () => {
    return useQuery({
      queryKey: ["task-price-list"],
      queryFn: () => taskListService.getTaskPriceList(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get brand stats (admin only)
  const useBrandStats = (brandId: string) => {
    return useQuery({
      queryKey: ["brand-tasklist-stats", brandId],
      queryFn: () => taskListService.getBrandTasklistStats(brandId),
      enabled: !!brandId && isAdmin,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Update item in cache helper
  const updateTaskListInCache = (updatedTasklist: TasklistRecord) => {
    if (!updatedTasklist.id) return;

    // Update list queries - Use a more specific approach to avoid duplicates
    const listQueries = queryClient.getQueriesData({
      queryKey: ["tasklists"],
      exact: false,
    });

    listQueries.forEach(([queryKey, oldData]) => {
      if (!oldData) return;

      queryClient.setQueryData(
        queryKey,
        (prev: TasklistListResponse | undefined) => {
          if (!prev?.tasklists) return prev;

          // Check if the item already exists and update it, don't add duplicates
          const existingIndex = prev.tasklists.findIndex(
            (item) => item.id && item.id === updatedTasklist.id
          );

          if (existingIndex >= 0) {
            // Update existing item
            const newTasklists = [...prev.tasklists];
            newTasklists[existingIndex] = updatedTasklist;

            return {
              ...prev,
              tasklists: newTasklists,
            };
          }

          // If not found, don't add it to avoid duplicates in cache
          return prev;
        }
      );
    });

    // Update single item query
    queryClient.setQueryData(
      ["tasklist", updatedTasklist.id],
      (prev: TasklistDetailResponse | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasklist: updatedTasklist,
        };
      }
    );
  };

  // Create tasklist mutation
  const createTaskListMutation = useMutation({
    mutationFn: (data: CreateTasklistRequest) =>
      taskListService.createTasklist(data),
    onMutate: () => {
      const toastId = toast.loading("Creating tasklist...");
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      // Invalidate all tasklist related queries
      queryClient.invalidateQueries({
        queryKey: ["tasklists"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["tasklist"],
        exact: false,
      });
      // Force refetch to ensure immediate update
      queryClient.refetchQueries({
        queryKey: ["tasklists"],
        exact: false,
      });
      toast.success("Tasklist created successfully", { id: context?.toastId });
      return data;
    },
    onError: (_error, _variables, context) => {
      console.error("Failed to create tasklist:", _error);
      toast.error(_error.message, { id: context?.toastId });
    },
  });

  // Update tasklist mutation (admin only)
  const updateTaskListMutation = useMutation({
    mutationFn: ({
      tasklistId,
      data,
      userId,
    }: {
      tasklistId: string;
      data: UpdateTasklistRequest;
      userId: string;
    }) => taskListService.updateTasklist(tasklistId, data, userId),
    onMutate: () => {
      const toastId = toast.loading("Updating tasklist...");
      return { toastId };
    },
    onSuccess: (updatedTasklist, variables, context) => {
      updateTaskListInCache(updatedTasklist);
      // Invalidate timeline query to show new status/notes update event
      queryClient.invalidateQueries({
        queryKey: ["tasklist-timeline", variables.tasklistId],
      });
      toast.success("Tasklist updated successfully", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      toast.error("Failed to update tasklist", { id: context?.toastId });
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: ["tasklists"],
      });
    },
  });

  // Adjust credits mutation (admin only)
  const adjustCreditsMutation = useMutation({
    mutationFn: ({
      tasklistId,
      data,
    }: {
      tasklistId: string;
      data: AdjustCreditsRequest;
    }) => taskListService.adjustTasklistCredits(tasklistId, data),
    onMutate: () => {
      const toastId = toast.loading("Adjusting credits...");
      return { toastId };
    },
    onSuccess: (updatedTasklist, variables, context) => {
      updateTaskListInCache(updatedTasklist);
      // Invalidate timeline query to show new credit adjustment event
      queryClient.invalidateQueries({
        queryKey: ["tasklist-timeline", variables.tasklistId],
      });
      toast.success("Credits adjusted successfully", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      console.error(
        "Failed to adjust credits:",
        _error,
        _variables.data.reason
      );
      toast.error(_error.message, {
        id: context?.toastId,
      });
      // Refetch to ensure data consistency on error
      queryClient.invalidateQueries({
        queryKey: ["tasklists"],
      });
    },
  });

  // Delete tasklist mutation (admin only)
  const deleteTaskListMutation = useMutation({
    mutationFn: ({
      tasklistId,
      userId,
    }: {
      tasklistId: string;
      userId: string;
    }) => taskListService.deleteTasklist(tasklistId, userId),
    onMutate: () => {
      const toastId = toast.loading("Deleting tasklist...");
      return { toastId };
    },
    onSuccess: (_data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["tasklists"],
      });
      // Remove from single item cache
      queryClient.removeQueries({
        queryKey: ["tasklist", variables.tasklistId],
      });
      toast.success("Tasklist deleted successfully", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      toast.error("Failed to delete tasklist", { id: context?.toastId });
    },
  });

  // Estimate task credit mutation
  const estimateTaskCreditMutation = useMutation({
    mutationFn: (data: TaskCreditEstimateRequest) =>
      taskListService.estimateTaskCredit(data),
    onError: () => {
      toast.error("Failed to estimate task credit");
    },
  });

  // Export tasklists mutation
  const exportTaskListsMutation = useMutation({
    mutationFn: (exportFilters: TasklistFilters) => {
      const roleBasedFilters = getFiltersWithRoleCheck(exportFilters);
      return taskListService.exportTasklistsCsv(roleBasedFilters);
    },
    onMutate: () => {
      const toastId = toast.loading("Preparing export...");
      return { toastId };
    },
    onSuccess: (blob, _variables, context) => {
      // Check if we received a valid CSV blob
      if (blob.type === "application/json") {
        // If we got JSON back, it's likely an error response
        blob.text().then((text) => {
          try {
            const errorResponse = JSON.parse(text);
            toast.error(errorResponse.message || "Export failed", {
              id: context?.toastId,
            });
          } catch {
            toast.error("Export failed", { id: context?.toastId });
          }
        });
        return;
      }

      // Create download link for CSV
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasklists-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export completed", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      toast.error("Export failed", { id: context?.toastId });
    },
  });

  return {
    // Queries
    taskListQuery,
    brandsQuery,
    useTaskListDetail,
    useTaskListTimeline,
    usePriceList,
    useBrandStats,

    // Mutations
    createTaskListMutation,
    updateTaskListMutation,
    adjustCreditsMutation,
    deleteTaskListMutation,
    estimateTaskCreditMutation,
    exportTaskListsMutation,

    // Helpers
    updateTaskListInCache,
    isAdmin,

    // Data
    tasklists: taskListQuery.data?.tasklists || [],
    totalCount: taskListQuery.data?.total_count || 0,
    brands: brandsQuery.data?.brands || [],
    pagination: {
      page: taskListQuery.data?.page || 1,
      pageSize: taskListQuery.data?.page_size || ITEMS_PER_PAGE,
      totalCount: taskListQuery.data?.total_count || 0,
      hasNextPage:
        (taskListQuery.data?.page || 1) *
          (taskListQuery.data?.page_size || ITEMS_PER_PAGE) <
        (taskListQuery.data?.total_count || 0),
      hasPreviousPage: (taskListQuery.data?.page || 1) > 1,
    },

    // Loading states
    isLoading: taskListQuery.isLoading,
    isError: taskListQuery.isError,
    error: taskListQuery.error,
  };
};
