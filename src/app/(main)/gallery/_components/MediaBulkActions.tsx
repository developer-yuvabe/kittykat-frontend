"use client";

import {
  Trash2,
  Download,
  ChevronDown,
  PackageIcon,
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
import { Badge } from "@/components/ui/badge";
import React, { useState } from "react";
import type {
  GalleryItemResponse,
  WorkflowStatus,
} from "@/types/gallery.types";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { GalleryActions } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { CatIcon } from "@/components/ui/custom-icon";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";
import { toast } from "sonner";
import JSZip from "jszip";
import { MediaBulkAskKittyKatDialog } from "./MediaBulkAskKittyKatDialog";
import { useBrandStore } from "@/store/brand.store";
import { useBulkGalleryOperations } from "@/hooks/useBulkGalleryOperations";
import type {
  GalleryFilters,
  BulkUpdateRequest,
} from "@/types/gallery.types";
import { galleryService } from "@/services/api/gallery.service";
import { MediaBulkMoveSection } from "./MediaBulkMoveSection";
import { MediaBulkCommentDialog } from "./MediaBulkCommentDialog";

interface MediaBulkActionsProps {
  selectedItems: GalleryItemResponse[];
  onUnselectAll: () => void;
  galleryActions: GalleryActions;
  brandName: string;
  onSelectAll?: () => void;
  totalItems?: number;
  fetchedItemsCount?: number;
  galleryFilters: GalleryFilters;
  currentBrandId?: string;
  currentCampaignId?: string | null;
  currentSubFolderId?: string;
  selectAllMode?: "none" | "visible" | "all";
  excludedItems?: string[];
  onSelectAllModeChange?: (mode: "none" | "visible" | "all") => void;
  onExcludedItemsChange?: (items: string[]) => void;
}

export function MediaBulkActions({
  selectedItems,
  onUnselectAll,
  galleryActions,
  brandName,
  onSelectAll,
  totalItems = 0,
  fetchedItemsCount = 0,
  galleryFilters,
  selectAllMode = "none",
  excludedItems = [],
  onSelectAllModeChange,
  onExcludedItemsChange,
}: MediaBulkActionsProps) {
  const { selectedBrandId } = useBrandStore();
  const bulkOps = useBulkGalleryOperations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isBulkAskKittyKatOpen, setIsBulkAskKittyKatOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkflowStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { user } = useUserStore();

  const effectiveSelectionCount =
    selectAllMode === "all"
      ? totalItems - excludedItems.length
      : selectAllMode === "visible"
      ? fetchedItemsCount - excludedItems.length
      : selectedItems.length;

  const selectedCount = effectiveSelectionCount;

  const uniqueStatuses = [
    ...new Set(selectedItems.map((item) => item.workflow_status)),
  ];
  const hasMultipleStatuses = uniqueStatuses.length > 1;
  const currentStatus = uniqueStatuses[0];

  const canClientChangeStatus =
    user?.role?.id === UserRoleId.USER &&
    !hasMultipleStatuses &&
    currentStatus === "in_review";

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
      const request = bulkOps.buildBulkRequest(
        galleryFilters,
        selectAllMode !== "none",
        itemIds,
        excludedItems
      );
      await bulkOps.bulkDelete.mutateAsync(request);
      onUnselectAll();
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const handleProductExtraction = async () => {
    const imageItems = selectedItems.filter((item) => item.asset_type === "image");
    const imageIds = imageItems.map((item) => item.id);
    await galleryActions.extractProducts({
      brandId: selectedBrandId!,
      data: { image_ids: imageIds },
    });
    onUnselectAll();
  };

  const getFileExtensionFromUrl = (url: string): string => {
    const fileName = url.split("/").pop()?.split("?")[0] || "";
    const ext = fileName.split(".").pop();
    return ext && ext.length < 6 ? ext : "jpg";
  };

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;

    const toastId = "bulk-download";
    let downloadedCount = 0;

    setIsDownloading(true);
    toast.loading("Preparing download...", { id: toastId });

    try {
      const itemIds = selectedItems.map((item) => item.id);
      const latestVersions = await galleryService.getLatestGalleryItemVersions(itemIds);

      if (!latestVersions || latestVersions.length === 0) {
        throw new Error("No downloadable items found");
      }

      const validItems = latestVersions.filter(
        (item) => item.asset_url || item.preview_url
      );

      const totalItemCount = validItems.length;
      const zip = new JSZip();
      const batchSize = 10;
      const urlBatches: GalleryItemResponse[][] = [];

      for (let i = 0; i < validItems.length; i += batchSize) {
        urlBatches.push(validItems.slice(i, i + batchSize));
      }

      for (const batch of urlBatches) {
        await Promise.all(
          batch.map(async (item) => {
            try {
              const assetUrl = item.asset_url || item.preview_url;
              if (!assetUrl) return;

              const response = await fetch(assetUrl);
              const blob = await response.blob();

              const fileName =
                assetUrl.split("/").pop()?.split("?")[0] || `file-${Date.now()}.jpg`;
              const extension = getFileExtensionFromUrl(assetUrl);
              const cleanFileName = fileName.endsWith(`.${extension}`)
                ? fileName
                : `${fileName}.${extension}`;

              zip.file(cleanFileName, blob);

              downloadedCount++;
              const percentage = Math.round((downloadedCount / totalItemCount) * 100);
              toast.loading(`Downloading: ${downloadedCount}/${totalItemCount} (${percentage}%)`, {
                id: toastId,
              });
            } catch (err) {
              console.error("Download failed:", item.asset_url, err);
            }
          })
        );
      }

      toast.loading("Creating ZIP file...", { id: toastId });
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `${slugify(brandName)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      toast.success("Download complete!", { id: toastId });
    } catch (error) {
      console.error("ZIP download failed:", error);
      toast.error("Download failed.", { id: toastId });
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
      const request = {
        ...bulkOps.buildBulkRequest(
          galleryFilters,
          selectAllMode !== "none",
          selectedItems.map((item) => item.id),
          excludedItems
        ),
        update_data: { workflow_status: selectedStatus },
      } satisfies BulkUpdateRequest;

      await bulkOps.bulkUpdate.mutateAsync(request);

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

  const getBatchRequestTooltip = () => {
    if (hasMultipleStatuses) {
      return "Cannot create batch request: selected items have different statuses";
    }
    if (currentStatus !== "draft") {
      return "Batch request can only be created for items with 'draft' status";
    }
    return "";
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

    return `You have ${statusMessages.join(", ")}. Do you want to change them all to "${selectedStatus}"?`;
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

          {/* Product Extraction - Only for images */}
          {selectedItems.every((item) => item.asset_type === "image") &&
            selectedItems.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleProductExtraction}
                    disabled={galleryActions.isExtractingProducts}
                  >
                    <PackageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Extract Products</p>
                </TooltipContent>
              </Tooltip>
            )}

          {/* Move Section */}
          <MediaBulkMoveSection
            selectedItems={selectedItems}
            selectAllMode={selectAllMode}
            excludedItems={excludedItems}
            galleryFilters={galleryFilters}
            totalItems={totalItems}
            fetchedItemsCount={fetchedItemsCount}
            onUnselectAll={onUnselectAll}
            galleryActions={galleryActions}
          />

          {/* Select All Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                className="bg-[#9095A0] hover:bg-[#9095A0] flex items-center gap-2"
              >
                <span>Select All</span>
                {selectAllMode !== "none" && (
                  <Badge variant="secondary" className="ml-1">
                    {effectiveSelectionCount}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Select Items</h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-sm"
                    onClick={() => {
                      onSelectAllModeChange?.("visible");
                      onExcludedItemsChange?.([]);
                      onSelectAll?.();
                    }}
                  >
                    <span>All Visible Items</span>
                    <Badge variant="secondary">{fetchedItemsCount}</Badge>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-sm"
                    onClick={() => {
                      onSelectAllModeChange?.("all");
                      onExcludedItemsChange?.([]);
                      onSelectAll?.();
                    }}
                  >
                    <span>All Items </span>
                    <Badge variant="secondary">{totalItems}</Badge>
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {selectAllMode === "all"
                    ? "All items matching current filters are selected. Newly loaded items will be auto-selected."
                    : selectAllMode === "visible"
                    ? "Only currently visible items are selected."
                    : "Choose a selection mode above."}
                </p>
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
                  <h4 className="font-medium text-sm">Change Workflow Status</h4>
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
                            canClientRequest ? setIsBulkAskKittyKatOpen(true) : null
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
                            !canClientChangeStatus ? null : handleStatusChange("approved")
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

      {/* Batch Comment Dialog */}
      <MediaBulkCommentDialog
        isOpen={isCommentDialogOpen}
        onClose={() => setIsCommentDialogOpen(false)}
        selectedItems={selectedItems}
        onUnselectAll={onUnselectAll}
        galleryActions={galleryActions}
      />

      {/* Bulk Ask KittyKat Dialog */}
      <MediaBulkAskKittyKatDialog
        open={isBulkAskKittyKatOpen}
        onOpenChange={setIsBulkAskKittyKatOpen}
        selectedItems={selectedItems}
        brandName={brandName}
        onSuccess={() => {
          onUnselectAll();
          galleryActions.refetchGalleryItems();
        }}
      />
    </TooltipProvider>
  );
}
