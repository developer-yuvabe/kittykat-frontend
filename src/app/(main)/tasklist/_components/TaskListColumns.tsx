"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { TasklistRecord } from "@/types/tasklist.types";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskListAssetCell } from "./TaskListAssetCell";
import { TaskListStatusCell } from "./TaskListStatusCell";

interface TaskListColumnsProps {
  page: number;
  limit: number;
  isAdmin: boolean;
  onViewDetails: (tasklist: TasklistRecord) => void;
  onAdjustCredits?: (tasklist: TasklistRecord) => void;
  onUpdateStatus?: (tasklist: TasklistRecord) => void;
  onEditNotes?: (tasklist: TasklistRecord) => void;
  onUpdateWorkflowStatus?: (assetId: string, brandId: string) => void;
}

export const getTaskListColumns = ({
  isAdmin,
  onViewDetails,
  onAdjustCredits,
  onEditNotes,
  onUpdateWorkflowStatus,
}: TaskListColumnsProps): ColumnDef<TasklistRecord>[] => {
  const baseColumns: ColumnDef<TasklistRecord>[] = [
    {
      id: "tasklist_id",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Tasklist ID
        </span>
      ),
      accessorKey: "id",
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="font-mono text-xs truncate whitespace-nowrap overflow-hidden text-center">
            <p className="font-medium"> TL-{id?.toUpperCase()}</p>
          </div>
        );
      },
      size: 80,
    },
    {
      id: "asset",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Asset
        </span>
      ),
      accessorKey: "asset_urls",
      cell: ({ row }) => (
        <TaskListAssetCell
          assetUrls={row.original.asset_urls}
          assetIds={row.original.asset_ids}
        />
      ),
      size: 80,
    },
    {
      id: "brand",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Brand
        </span>
      ),
      accessorKey: "brand_name",
      cell: ({ row }) => (
        <p className="text-sm font-medium truncate whitespace-nowrap overflow-hidden text-center">
          {row.original.brand_name}
        </p>
      ),
      size: 100,
    },
    {
      id: "campaign",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Campaign
        </span>
      ),
      accessorKey: "campaign_name",
      cell: ({ row }) => (
        <p className="text-sm truncate whitespace-nowrap overflow-hidden text-center">
          {row.original.campaign_name || "—"}
        </p>
      ),
      size: 100,
    },
    {
      id: "submitted_by",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Submitted By
        </span>
      ),
      accessorKey: "submitted_by_name",
      cell: ({ row }) => (
        <div className="text-sm truncate whitespace-nowrap overflow-hidden text-center">
          <p className="font-medium">
            {row.original.submitted_by_name || "Unknown"}
          </p>
        </div>
      ),
      size: 100,
    },
    {
      id: "submitted_at",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Submitted At
        </span>
      ),
      accessorKey: "submitted_at",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground truncate whitespace-nowrap overflow-hidden text-center">
          {format(new Date(row.original.submitted_at), "MMM dd, yyyy")}
        </p>
      ),
      size: 90,
    },
    {
      id: "status",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Kittykat Asset Status
        </span>
      ),
      accessorKey: "asset_ids",
      cell: ({ row }) => (
        <TaskListStatusCell
          status={row.original.asset_expert_status}
          assetId={row.original.asset_ids?.[0]} // Use first asset ID
          brandId={row.original.brand_id}
          isAdmin={isAdmin}
          onUpdateWorkflowStatus={onUpdateWorkflowStatus}
        />
      ),
      size: 120,
    },
    {
      id: "estimated_credits",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Estimated
        </span>
      ),
      accessorKey: "estimated_credits",
      cell: ({ row }) => (
        <p className="text-sm font-mono truncate whitespace-nowrap overflow-hidden text-center">
          {row.original.estimated_credits}
        </p>
      ),
      size: 70,
    },
    {
      id: "adjustments",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Adjustments
        </span>
      ),
      accessorKey: "adjustment_logs",
      cell: ({ row }) => {
        const adjustmentCount = row.original.adjustment_logs?.length || 0;
        return (
          <div className="text-sm truncate whitespace-nowrap overflow-hidden text-center">
            {adjustmentCount > 0 ? (
              <Badge
                variant="outline"
                className="text-xs truncate whitespace-nowrap overflow-hidden text-center"
              >
                {adjustmentCount}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
      size: 70,
    },
    {
      id: "final_credits",
      header: () => (
        <span className="block truncate whitespace-nowrap overflow-hidden text-center">
          Total
        </span>
      ),
      accessorKey: "final_credits",
      cell: ({ row }) => (
        <p className="text-sm font-mono font-semibold truncate whitespace-nowrap overflow-hidden text-center">
          {row.original.final_credits}
        </p>
      ),
      size: 70,
    },
  ];

  // Admin-only columns
  const adminColumns: ColumnDef<TasklistRecord>[] = isAdmin
    ? [
        {
          id: "latest_adjustment",
          header: "Latest Adjustment",
          accessorKey: "adjustment_logs",
          cell: ({ row }) => {
            const latestAdjustment = row.original.adjustment_logs?.[0];
            return latestAdjustment ? (
              <div className="text-xs">
                <p className="font-medium">{latestAdjustment.reason}</p>
                <p className="text-muted-foreground">
                  by {latestAdjustment.adjusted_by}
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            );
          },
          size: 150,
        },
        {
          id: "notes",
          header: "Notes",
          accessorKey: "notes",
          cell: ({ row }) => (
            <p className="text-xs text-muted-foreground max-w-[150px] truncate">
              {row.original.notes || "—"}
            </p>
          ),
          size: 150,
        },
      ]
    : [];

  // Actions column
  const actionsColumn: ColumnDef<TasklistRecord> = {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(row.original);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const firstAssetId = row.original.asset_ids?.[0];
                  if (firstAssetId) {
                    onUpdateWorkflowStatus?.(
                      firstAssetId,
                      row.original.brand_id
                    );
                  }
                }}
              >
                Update Workflow Status
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustCredits?.(row.original);
                }}
              >
                Adjust Credits
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEditNotes?.(row.original);
                }}
              >
                Edit Notes
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    size: 60,
  };

  return [...baseColumns, ...adminColumns, actionsColumn];
};
