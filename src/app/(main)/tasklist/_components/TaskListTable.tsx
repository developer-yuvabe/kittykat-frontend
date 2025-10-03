"use client";

import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskList } from "@/hooks/useTaskList";
import { getTaskListColumns } from "./TaskListColumns";
import { WorkflowStatusDialog } from "./TaskListStatusDialog";
import type { TasklistRecord, TasklistFilters } from "@/types/tasklist.types";

interface TaskListTableProps {
  filters: TasklistFilters;
  onFiltersChange: (filters: TasklistFilters) => void;
  onTasklistSelect: (tasklist: TasklistRecord) => void;
  onAdjustCredits?: (tasklist: TasklistRecord) => void;
  onEditNotes?: (tasklist: TasklistRecord) => void;
}

export const TaskListTable = ({
  filters,
  onFiltersChange,
  onTasklistSelect,
  onAdjustCredits,
  onEditNotes,
}: TaskListTableProps) => {
  const [selectedTasklist, setSelectedTasklist] =
    useState<TasklistRecord | null>(null);
  const [workflowStatusDialogOpen, setWorkflowStatusDialogOpen] =
    useState(false);
  const [selectedTasklistForStatus, setSelectedTasklistForStatus] =
    useState<TasklistRecord | null>(null);

  const {
    taskListQuery,
    isAdmin,
    tasklists,
    pagination,
    isLoading,
    exportTaskListsMutation,
  } = useTaskList({ filters });

  const handlePageChange = useCallback(
    (newPage: number) => {
      onFiltersChange({
        ...filters,
        page: newPage,
      });
    },
    [filters, onFiltersChange]
  );

  const handleViewDetails = useCallback(
    (tasklist: TasklistRecord) => {
      setSelectedTasklist(tasklist);
      onTasklistSelect(tasklist);
    },
    [onTasklistSelect]
  );

  const handleAdjustCredits = useCallback(
    (tasklist: TasklistRecord) => {
      onAdjustCredits?.(tasklist);
    },
    [onAdjustCredits]
  );

  const handleEditNotes = useCallback(
    (tasklist: TasklistRecord) => {
      onEditNotes?.(tasklist);
    },
    [onEditNotes]
  );

  const handleUpdateWorkflowStatus = useCallback(
    (assetId: string, brandId: string) => {
      // Find the tasklist that matches the asset and brand
      const tasklist = taskListQuery.data?.tasklists.find(
        (t) => t.asset_ids?.includes(assetId) && t.brand_id === brandId
      );
      if (tasklist) {
        setSelectedTasklistForStatus(tasklist);
        setWorkflowStatusDialogOpen(true);
      }
    },
    [taskListQuery.data?.tasklists]
  );

  const handleExport = useCallback(() => {
    exportTaskListsMutation.mutate(filters);
  }, [exportTaskListsMutation, filters]);

  const handleRefresh = useCallback(() => {
    taskListQuery.refetch();
  }, [taskListQuery]);

  const columns = useMemo(
    () =>
      getTaskListColumns({
        page: pagination.page,
        limit: pagination.pageSize,
        isAdmin,
        onViewDetails: handleViewDetails,
        onAdjustCredits: handleAdjustCredits,
        onEditNotes: handleEditNotes,
        onUpdateWorkflowStatus: handleUpdateWorkflowStatus,
      }),
    [
      pagination.page,
      pagination.pageSize,
      isAdmin,
      handleViewDetails,
      handleAdjustCredits,
      handleEditNotes,
      handleUpdateWorkflowStatus,
    ]
  );

  const tableData = useMemo(() => tasklists, [tasklists]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(pagination.totalCount / pagination.pageSize),
  });

  return (
    <div className="w-full space-y-4 h-full flex flex-col">
      {/* Top Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">KittyKat Expert Management</h1>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              ({pagination.totalCount} tasklists)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exportTaskListsMutation.isPending || isLoading}
            className="h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            disabled={taskListQuery.isRefetching}
            title="Refresh Tasklists"
            className="h-9 w-9"
          >
            <RefreshCcw
              className={cn(
                "h-4 w-4",
                taskListQuery.isRefetching ? "animate-spin" : "opacity-50"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden">
        {/* Table Header (separate, always visible) */}
        <Table style={{ tableLayout: "fixed", width: "100%" }}>
          <TableHeader className="bg-background border-b z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                onClick={(e) => e.stopPropagation()}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="font-medium"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-auto max-h-[calc(100vh-350px)]">
          <Table style={{ tableLayout: "fixed", width: "100%" }}>
            <TableBody>
              {isLoading ||
              taskListQuery.isFetching ||
              taskListQuery.isRefetching ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, idx) => (
                      <TableCell key={idx}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center italic text-base py-20"
                  >
                    {filters.search ||
                    filters.asset_expert_statuses ||
                    (Array.isArray(filters.brand_ids) &&
                      filters.brand_ids.length > 0)
                      ? "No tasklists found matching your filters"
                      : "No tasklists found"}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30",
                      selectedTasklist?.id === row.original.id
                        ? "bg-muted/50"
                        : ""
                    )}
                    onClick={() => handleViewDetails(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-4 flex items-center justify-between bg-background border-t">
          <div className="text-sm text-muted-foreground">
            {!isLoading && tasklists.length > 0 && (
              <span>
                Showing {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} tasklists
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm px-2">Page {pagination.page}</span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Status Dialog */}
      {selectedTasklistForStatus && (
        <WorkflowStatusDialog
          isOpen={workflowStatusDialogOpen}
          onClose={() => {
            setWorkflowStatusDialogOpen(false);
            setSelectedTasklistForStatus(null);
          }}
          tasklist={selectedTasklistForStatus}
        />
      )}
    </div>
  );
};
