"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useGalleryQuery, ITEMS_PER_PAGE } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import type { TasklistRecord, TasklistStatus } from "@/types/tasklist.types";
import type { WorkflowStatus } from "@/types/gallery.types";
import { useTaskList } from "@/hooks/useTaskList";
import {
  WORKFLOW_STATUS_MAP,
  WORKFLOW_STATUS_OPTIONS,
} from "@/lib/gallery.utils";
import { useState } from "react";
import { Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WorkflowStatusDialogProps {
  tasklist: TasklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowStatusDialog = ({
  tasklist,
  isOpen,
  onClose,
}: WorkflowStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUserStore();
  const { updateTaskListMutation } = useTaskList();

  const galleryActions = useGalleryQuery(
    {
      selectedFilters: {
        brands: tasklist ? [tasklist.brand_id] : [],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    ITEMS_PER_PAGE,
    !!tasklist,
    "WorkflowStatusDialog"
  );

  const galleryItem = tasklist
    ? galleryActions.useGalleryItem(tasklist.asset_ids[0])
    : undefined;

  const handleSubmit = async () => {
    if (!tasklist || !selectedStatus || !user) return;

    setIsSubmitting(true);
    try {
      // Update the tasklist status
      await updateTaskListMutation.mutateAsync({
        tasklistId: tasklist.id!,
        data: { asset_expert_status: selectedStatus as TasklistStatus },
        userId: user.id,
      });

      // Update the gallery item with new workflow status if gallery item exists
      if (galleryItem?.data) {
        galleryActions.patchItem({
          itemId: tasklist.asset_ids[0],
          data: { workflow_status: selectedStatus },
        });
      }

      // Add notes as a comment to the asset if notes are provided
      if (notes.trim()) {
        galleryActions.addComment({
          itemId: tasklist.asset_ids[0],
          commentData: {
            text: notes.trim(),
            is_tasklist: true,
          },
        });
      }

      toast.success(
        `Status updated to ${WORKFLOW_STATUS_MAP[selectedStatus].label}`
      );
      onClose();
      setSelectedStatus("");
      setNotes("");
    } catch (error) {
      console.error("Failed to update workflow status:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStatus = tasklist?.asset_expert_status;
  const currentStatusConfig = currentStatus
    ? WORKFLOW_STATUS_MAP[currentStatus as WorkflowStatus]
    : null;

  // Check if the asset is a video
  const isVideo =
    galleryItem?.data?.asset_type === "video";

    const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedStatus("");
      setNotes("");
    }
  };

  if (!tasklist) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            <span className="text-muted-foreground">No tasklist selected</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Update Workflow Status
          </DialogTitle>
          <DialogDescription>
            Change the workflow status for this asset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Asset Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">

                <>
                  {isVideo ? (
                    <video
                      src={tasklist.asset_urls[0]}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                src={tasklist.asset_urls[0]}
                      alt="Asset"
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
             
            </div>
            <div>
              <p className="font-medium text-sm">
                {galleryItem?.data?.asset_title || "Untitled Asset"}
              </p>
              <p className="text-xs text-muted-foreground">
                {galleryItem?.data?.asset_type || "Unknown"}
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Current Status
            </Label>
            <div className="mt-2">
              {currentStatusConfig ? (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${currentStatusConfig.dotColor}`}
                  />
                  <span className="text-sm font-medium">
                    {currentStatusConfig.label}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No status set
                </span>
              )}
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as WorkflowStatus)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STATUS_OPTIONS.map((option) => {
                  const isCurrentStatus = option.value === currentStatus;
                  return (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={isCurrentStatus}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${option.dotColor}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                        </div>
                        {isCurrentStatus && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Update Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              These notes will be added as a comment to the asset.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedStatus ||
              isSubmitting ||
              selectedStatus === currentStatus
            }
            className="min-w-[100px]"
          >
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
