"use client";

import {
  Trash2,
  Download,
  ChevronDown,
  Upload,
  X,
  FileText,
  Image,
  File,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useState, useRef } from "react";
import type {
  GalleryItemResponse,
  WorkflowStatus,
} from "@/types/gallery.types";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { GalleryActions } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { v4 } from "uuid";
import { CatIcon, LibraryIcon } from "@/components/ui/custom-icon";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";

interface MediaBulkActionsProps {
  selectedItems: GalleryItemResponse[];
  onUnselectAll: () => void;
  galleryActions: GalleryActions;
}

type MoveAction = "brand" | "campaign" | "source";

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

  const [attachments, setAttachments] = useState<File[]>([]);

  const [isAddingComment, setIsAddingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Move states - separate for each action
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveAction, setMoveAction] = useState<MoveAction>("brand");
  const [isMoving, setIsMoving] = useState(false);

  // Individual move values
  const [targetBrandId, setTargetBrandId] = useState<string>("");
  const [targetCampaignId, setTargetCampaignId] = useState<string>("");
  const [targetSource, setTargetSource] = useState<string>("");

  const selectedCount = selectedItems.length;
  const { user } = useUserStore();

  // Get unique statuses of selected items
  const uniqueStatuses = [
    ...new Set(selectedItems.map((item) => item.workflow_status)),
  ];
  const hasMultipleStatuses = uniqueStatuses.length > 1;
  const currentStatus = uniqueStatuses[0];

  // Get unique brands, campaigns, and sources from selected items
  const uniqueBrands = [...new Set(selectedItems.map((item) => item.brand_id))];
  const uniqueCampaigns = [
    ...new Set(selectedItems.map((item) => item.campaign_id).filter(Boolean)),
  ];
  const uniqueSources = [
    ...new Set(selectedItems.map((item) => item.asset_source)),
  ];

  const canClientChangeStatus =
    user?.role?.id === UserRoleId.USER &&
    !hasMultipleStatuses &&
    currentStatus === "in_review";

  // Status restrictions for client users
  const canClientRequest =
    user?.role?.id === UserRoleId.USER &&
    !hasMultipleStatuses &&
    currentStatus === "draft";

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
      galleryActions.refetchGalleryItems();
    } catch (error) {
      console.error("Status update error:", error);
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusDialogOpen(false);
      setSelectedStatus(null);
    }
  };

  // File attachment handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getBatchRequestTooltip = () => {
    if (hasMultipleStatuses) {
      return "Cannot create batch request: selected items have different statuses";
    }
    if (currentStatus !== "draft") {
      return "Batch request can only be created for items with 'draft' status";
    }
    return "";
  };

  const resetCommentDialog = () => {
    setComment("");
    setAttachments([]);

    setIsCommentDialogOpen(false);
  };

  const handleBulkComment = async () => {
    if (!comment.trim()) return;

    setIsAddingComment(true);

    try {
      // Upload all selected files (if any)
      const uploadedUrls = await Promise.all(
        attachments.map((file) =>
          uploadFileAndReturnUrl(file.name, file.type, "ask-kittykat", file)
        )
      );

      // const uploadedUrls = await Promise.all(
      //   attachments.map((file, index) => {
      //     const item = selectedItems[index];
      //     return uploadFileAndReturnUrl(
      //       file.name,
      //       file.type,
      //       "ask-kittykat",
      //       file,
      //       item.brand_id,
      //       item.campaign_id ?? undefined
      //     );
      //   })
      // );

      const commentPayload = {
        text: `[batch-comment] ${comment.trim()}`,
        id: v4(),
        added_by: user?.id ?? "",
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: uploadedUrls,
      };

      await Promise.all(
        selectedItems.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: {
              comments: [commentPayload],
              workflow_status: "request_created",
            },
          })
        )
      );

      // Reset UI
      resetCommentDialog();
      onUnselectAll();
      galleryActions.refetchGalleryItems();
    } catch (error) {
      console.error("Bulk comment error:", error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleMoveAction = (action: MoveAction) => {
    setMoveAction(action);
    setIsMoveDialogOpen(true);
    // Reset values
    setTargetBrandId("");
    setTargetCampaignId("");
    setTargetSource("");
  };

  const handleConfirmMove = async () => {
    setIsMoving(true);
    try {
      const updateData: any = {};

      if (moveAction === "brand" && targetBrandId) {
        updateData.brand_id = targetBrandId;
        // When moving to a different brand, remove campaign assignment
        updateData.campaign_id = null;
      } else if (moveAction === "campaign" && targetCampaignId) {
        if (targetCampaignId === "none") {
          updateData.campaign_id = null;
        } else {
          updateData.campaign_id = targetCampaignId;
          // When moving to a campaign, also update the brand to match the campaign's brand
          const campaignWithBrand = galleryActions.brandsData?.brands.find(
            (brand) =>
              brand.campaigns.some((camp) => camp.id === targetCampaignId)
          );
          if (campaignWithBrand) {
            updateData.brand_id = campaignWithBrand.brand_id;
          }
        }
      } else if (moveAction === "source" && targetSource) {
        updateData.asset_source = targetSource;
      }

      await Promise.all(
        selectedItems.map((item) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: updateData,
          })
        )
      );

      onUnselectAll();
      galleryActions.refetchGalleryItems();
      setIsMoveDialogOpen(false);
    } catch (error) {
      console.error("Move error:", error);
    } finally {
      setIsMoving(false);
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

  // Get available campaigns based on move action
  const getAvailableCampaigns = () => {
    if (moveAction === "campaign") {
      // If moving within campaigns, check if all selected items are from the same brand
      const fromSameBrand = uniqueBrands.length === 1;

      if (fromSameBrand) {
        // Show only campaigns from the current brand
        const currentBrandId = uniqueBrands[0];
        const currentBrand = galleryActions.brandsData?.brands.find(
          (brand) => brand.brand_id === currentBrandId
        );
        return (
          currentBrand?.campaigns.map((campaign) => ({
            ...campaign,
            brand_name: currentBrand.brand_name,
            brand_id: currentBrand.brand_id,
          })) || []
        );
      } else {
        // Show all campaigns from all brands (moving between brands)
        return (
          galleryActions.brandsData?.brands.flatMap((brand) =>
            brand.campaigns.map((campaign) => ({
              ...campaign,
              brand_name: brand.brand_name,
              brand_id: brand.brand_id,
            }))
          ) || []
        );
      }
    }
    return [];
  };

  const getMoveDialogContent = () => {
    const currentInfo = {
      brands: uniqueBrands.length,
      campaigns: uniqueCampaigns.length,
      sources: uniqueSources.length,
    };

    const availableCampaigns = getAvailableCampaigns();
    const fromSameBrand = uniqueBrands.length === 1;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Current Selection</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span>Items:</span>
              <Badge variant="secondary">{selectedCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>
                From {currentInfo.brands} brand(s), {currentInfo.campaigns}{" "}
                campaign(s), {currentInfo.sources} source(s)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {moveAction === "brand" && "Move to Brand"}
            {moveAction === "campaign" && "Move to Campaign"}
            {moveAction === "source" && "Move to Source"}
          </Label>

          {moveAction === "brand" && (
            <Select value={targetBrandId} onValueChange={setTargetBrandId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target brand" />
              </SelectTrigger>
              <SelectContent>
                {galleryActions.brandsData?.brands.map((brand) => (
                  <SelectItem key={brand.brand_id} value={brand.brand_id}>
                    {brand.brand_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {moveAction === "campaign" && (
            <div className="space-y-2">
              {!fromSameBrand && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Moving between brands: Campaign selection will also update
                    the brand.
                  </p>
                </div>
              )}
              <Select
                value={targetCampaignId}
                onValueChange={setTargetCampaignId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Remove from Campaign</SelectItem>
                  {availableCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.title}
                      {!fromSameBrand && (
                        <span className="text-gray-500 ml-2">
                          ({campaign.brand_name})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {moveAction === "source" && (
            <Select value={targetSource} onValueChange={setTargetSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select target source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand-uploads">Brand Uploads</SelectItem>
                <SelectItem value="showboard-media">Concept Visuals</SelectItem>
                <SelectItem value="a2i-media">A2I Media</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {((moveAction === "brand" && targetBrandId) ||
          (moveAction === "campaign" && targetCampaignId) ||
          (moveAction === "source" && targetSource)) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-sm mb-2 text-blue-800">
              Move Summary
            </h4>
            <p className="text-sm text-blue-700">
              Moving {selectedCount} item(s) to{" "}
              {moveAction === "brand" && (
                <>
                  {
                    galleryActions.brandsData?.brands.find(
                      (b) => b.brand_id === targetBrandId
                    )?.brand_name
                  }
                  <span className="block text-xs mt-1 text-blue-600">
                    Note: Items will be removed from their current campaigns
                  </span>
                </>
              )}
              {moveAction === "campaign" &&
                targetCampaignId === "none" &&
                "No Campaign"}
              {moveAction === "campaign" && targetCampaignId !== "none" && (
                <>
                  {
                    availableCampaigns.find((c) => c.id === targetCampaignId)
                      ?.title
                  }
                  {!fromSameBrand && (
                    <span className="block text-xs mt-1 text-blue-600">
                      Brand will be updated to:{" "}
                      {
                        availableCampaigns.find(
                          (c) => c.id === targetCampaignId
                        )?.brand_name
                      }
                    </span>
                  )}
                </>
              )}
              {moveAction === "source" && targetSource}
            </p>
          </div>
        )}
      </div>
    );
  };

  const isValidMove = () => {
    return (
      (moveAction === "brand" && targetBrandId) ||
      (moveAction === "campaign" && targetCampaignId) ||
      (moveAction === "source" && targetSource)
    );
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-x-2">
          <Button variant="ghost" size="icon" onClick={handleBulkDeleteClick}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBulkDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Move Asset Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="default"
                disabled={!galleryActions.brandsData?.brands?.length}
                className="bg-[#9095A0] hover:bg-[#9095A0] text-white hover:text-white"
              >
                Move to... <LibraryIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1 m-0">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleMoveAction("campaign")}
                >
                  Move to another Campaign
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleMoveAction("source")}
                >
                  Move to another Tab
                </Button>
              </div>
            </PopoverContent>
          </Popover>

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
                  Kittykat Expert
                  <CatIcon />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 m-0 w-40">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          disabled={!canClientRequest}
                          onClick={() =>
                            canClientRequest
                              ? setIsCommentDialogOpen(true)
                              : null
                          }
                        >
                          Batch Request
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canClientRequest && (
                      <TooltipContent side="left">
                        <p>{getBatchRequestTooltip()}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          disabled={!canClientChangeStatus}
                          onClick={() =>
                            !canClientChangeStatus
                              ? null
                              : handleStatusChange("approved")
                          }
                        >
                          Batch Approve
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canClientChangeStatus && (
                      <TooltipContent side="left">
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

      {/* Move Assets Dialog */}
      <ReusableAlertDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        title={`Move Assets - ${
          moveAction === "brand"
            ? "Brand"
            : moveAction === "campaign"
            ? "Campaign"
            : "Source"
        }`}
        description={getMoveDialogContent()}
        confirmLabel="Move"
        cancelLabel="Cancel"
        onConfirm={handleConfirmMove}
        isLoading={isMoving}
        confirmDisabled={!isValidMove()}
      />

      {/* Batch Comment Dialog */}
      <ReusableAlertDialog
        open={isCommentDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetCommentDialog();
          else setIsCommentDialogOpen(open);
        }}
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

            <div className="space-y-3">
              <Label htmlFor="comment" className="text-sm font-medium">
                Comment *
              </Label>
              <Textarea
                id="comment"
                placeholder="Enter your comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Attachments (Optional)
              </Label>

              {/* Hidden file input */}
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={handleDropZoneClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF, DOC, TXT up to 10MB each
                </p>
              </div>

              {/* Attached files list */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Attached Files ({attachments.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
