"use client";

import { Trash2, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { PiShareFat } from "react-icons/pi";
import type {
  GalleryItemResponse,
  WorkflowStatus,
} from "@/types/gallery.types";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { GalleryActions } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { v4 } from "uuid";
import { CatIcon } from "@/components/ui/custom-icon";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";

interface MediaBulkActionsProps {
  selectedItems: GalleryItemResponse[];
  onUnselectAll: () => void;
  galleryActions: GalleryActions;
}

export function MediaBulkActions({
  selectedItems,
  onUnselectAll,
  galleryActions,
}: MediaBulkActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | null>(
    null
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [comment, setComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

  const selectedCount = selectedItems.length;
  const { user } = useUserStore();

  // Get unique statuses of selected items
  const uniqueStatuses = [
    ...new Set(selectedItems.map((item) => item.workflow_status)),
  ];
  const hasMultipleStatuses = uniqueStatuses.length > 1;
  const currentStatus = uniqueStatuses[0];

  // For clients, check if they can change status (only if all items have "in_review" status)
  const canClientChangeStatus =
    user?.role?.id === UserRoleId.USER &&
    !hasMultipleStatuses &&
    currentStatus === "in_review";

  const handleBulkDeleteClick = () => {
    if (selectedItems.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const itemIds = selectedItems.map((item) => item.id);
      galleryActions.bulkDelete(itemIds);
      onUnselectAll();
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;

    setIsDownloading(true);
    try {
      for (const item of selectedItems) {
        await galleryActions.downloadItem(item);
      }
    } catch (error) {
      console.error("Bulk download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusChange = (status: WorkflowStatus) => {
    setSelectedStatus(status);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedStatus) return;

    setIsUpdatingStatus(true);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: { workflow_status: selectedStatus },
          })
        )
      );
      onUnselectAll();
    } catch (error) {
      console.error("Status update error:", error);
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusDialogOpen(false);
      setSelectedStatus(null);
    }
  };

  const handleBulkComment = async () => {
    if (!comment.trim()) return;

    setIsAddingComment(true);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: {
              comments: [
                {
                  text: `[batch-comment] ${comment.trim()}`,
                  id: v4(),
                  added_by: user?.id ?? "",
                  added_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ],
              workflow_status: "request_created",
            },
          })
        )
      );
      setComment("");
      setIsCommentDialogOpen(false);
      onUnselectAll();
    } catch (error) {
      console.error("Bulk comment error:", error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStatusCountMessage = () => {
    if (!selectedStatus) return "";

    const statusCounts: Record<string, number> = {};
    selectedItems.forEach((item) => {
      const status = item.workflow_status || "draft";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusMessages = Object.entries(statusCounts).map(
      ([status, count]) => `${count} item(s) with status "${status}"`
    );

    return `You have ${statusMessages.join(
      ", "
    )}. Do you want to change them all to "${selectedStatus}"?`;
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-x-2">
          <Button variant="ghost" size="icon" onClick={handleBulkDeleteClick}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <PiShareFat className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBulkDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            onClick={onUnselectAll}
            className="bg-[#9095A0] hover:bg-[#9095A0]"
          >
            Unselect All
          </Button>

          {/* Admin Status Change */}
          {user?.role?.id === UserRoleId.ADMIN && (
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-[#636AE8] hover:bg-[#636AE8] flex items-center gap-2">
                  <span>Change Status</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">
                    Change Workflow Status
                  </h4>
                  <div className="space-y-1">
                    {WORKFLOW_STATUS_OPTIONS.map((status) => (
                      <Button
                        key={status.value}
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => handleStatusChange(status.value)}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Client Status Change */}
          {user?.role?.id === UserRoleId.USER && (
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-[#636AE8] hover:bg-[#636AE8] flex items-center gap-2">
                  Ask Kitty
                  <CatIcon />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 m-0 w-40">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => setIsCommentDialogOpen(true)}
                >
                  Batch Request
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          disabled={!canClientChangeStatus}
                          onClick={
                            () =>
                              !canClientChangeStatus
                                ? null
                                : handleStatusChange("approved") // defaulting to one, or open a nested popover
                          }
                        >
                          Change Status
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canClientChangeStatus && (
                      <TooltipContent>
                        <p>
                          {hasMultipleStatuses
                            ? "Cannot change status: selected items have different statuses"
                            : "Can only change status for items in review"}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ReusableAlertDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Delete Items"
        description={`Are you sure you want to delete ${selectedCount} item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        danger
      />

      {/* Status Change Confirmation Dialog */}
      <ReusableAlertDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        title="Change Status"
        description={getStatusCountMessage()}
        confirmLabel="Change Status"
        cancelLabel="Cancel"
        onConfirm={handleConfirmStatusChange}
        isLoading={isUpdatingStatus}
      />

      {/* Batch Comment Dialog */}
      <ReusableAlertDialog
        open={isCommentDialogOpen}
        onOpenChange={setIsCommentDialogOpen}
        title="Add Batch Comment"
        description={
          <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-gray-600 font-medium mb-2">Need an edit?</p>
              <p className="mb-4">
                To request edits for this image, please follow the steps below:
              </p>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold text-gray-800">
                    Specify the changes:
                  </span>{" "}
                  Clearly describe what you want to modify, add, or remove in
                  the image.
                </li>
                <li>
                  <span className="font-semibold text-gray-800">
                    Upload reference assets:
                  </span>{" "}
                  Attach any images, sketches, or files that can help clarify
                  your request.
                </li>
                <li>
                  <span className="font-semibold text-gray-800">
                    Be as detailed as possible:
                  </span>{" "}
                  The more information you provide, the better we can assist
                  you.
                </li>
              </ul>

              <p className="mt-4">
                Once submitted, our team will review your request and respond as
                soon as possible.
              </p>

              <p className="text-xs text-red-600 font-semibold mt-3">
                Note: Image edit requests are chargeable as per the scope of
                work.
              </p>
            </div>

            <Textarea
              placeholder="Enter your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        }
        confirmLabel="Add Comment"
        cancelLabel="Cancel"
        onConfirm={handleBulkComment}
        isLoading={isAddingComment}
        confirmDisabled={!comment.trim()}
      />
    </TooltipProvider>
  );
}
