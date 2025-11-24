"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/store/brand.store";
import { cn } from "@/lib/utils";
import {
  deleteCampaign,
  patchCampaign,
  updateCampaign,
} from "@/services/api/brand.service";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { useCampaignCounts } from "@/hooks/useCampaignCounts";
import { GalleryActions } from "@/hooks/useGallery";
import { CampaignSidebarHeader } from "./CampaignSidebarHeader";
import { CampaignSidebarRow } from "./CampaignSidebarRow";
import { CampaignSidebarRenameDialog } from "./CampaignSidebarRenameDialog";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import BrandSelector from "@/components/chatbot/brands/BrandSelector";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignsSidebarProps {
  selectedBrandId: string | null;
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string) => void;
  galleryActions?: GalleryActions;
  setInitialBrandId: (
    value: string | null | ((old: string | null) => string | null)
  ) => Promise<URLSearchParams>;
  setSelectedCampaignInUrl: (
    value: string | null | ((old: string | null) => string | null)
  ) => Promise<URLSearchParams>;
  setSelectedFilters: React.Dispatch<
    React.SetStateAction<EnhancedSelectedFilters>
  >;
  hasNoBrands: boolean;
  galleryView: "grid" | "folder";
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

export function CampaignsSidebar({
  selectedBrandId,
  selectedCampaignId,
  onCampaignSelect,
  galleryActions,
  setInitialBrandId,
  setSelectedCampaignInUrl,
  setSelectedFilters,
  hasNoBrands,
  galleryView,
  setSelectedItems,
  isCollapsed,
  onToggleCollapsed,
}: CampaignsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brands } = useBrandStore();
  const { setSelectedCampaignId } = useBrandStore();
  const { orderBy, setOrderBy } = useGalleryFilterStore();
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();

  // Dialog states - simplified
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignTitle: string;
  }>({ open: false, campaignId: "", campaignTitle: "" });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isDeleting: boolean;
  }>({ open: false, campaignId: "", campaignTitle: "", isDeleting: false });

  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isArchived: boolean;
    isProcessing: boolean;
  }>({
    open: false,
    campaignId: "",
    campaignTitle: "",
    isArchived: false,
    isProcessing: false,
  });

  // Drag-and-drop state
  const [dragOverCampaignId, setDragOverCampaignId] = useState<string | null>(
    null
  );
  const [dragOverSection, setDragOverSection] = useState<
    "active" | "archived" | null
  >(null);
  const [draggedCampaignId, setDraggedCampaignId] = useState<string | null>(
    null
  );
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(
    null
  );
  const [reorderTargetId, setReorderTargetId] = useState<string | null>(null);

  // Fetch campaign counts
  const { data: countData, isLoading: isCountLoading } =
    useCampaignCounts(selectedBrandId);

  const { campaigns, brandName } = useMemo(() => {
    const brand = brands.find((b) => b.id === selectedBrandId);
    return {
      campaigns: brand ? brand.campaigns : [],
      brandName: brand?.name ?? "Brand",
    };
  }, [brands, selectedBrandId]);

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    const query = searchQuery.toLowerCase();
    return campaigns.filter((campaign) =>
      campaign.title.toLowerCase().includes(query)
    );
  }, [campaigns, searchQuery]);

  // Sort campaigns by position (if available), otherwise maintain current order
  const sortByPosition = (campaignList: typeof campaigns) => {
    return [...campaignList].sort((a, b) => {
      // If both have positions, sort by position
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      // If only 'a' has position, it comes first
      if (a.position !== undefined) return -1;
      // If only 'b' has position, it comes first
      if (b.position !== undefined) return 1;
      // If neither has position, maintain current order
      return 0;
    });
  };

  const activeCampaigns = sortByPosition(
    filteredCampaigns.filter((c) => !c.is_archived)
  );
  const archivedCampaigns = sortByPosition(
    filteredCampaigns.filter((c) => c.is_archived)
  );

  // Handlers
  const handleDelete = async () => {
    if (!selectedBrandId) return;
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    const title = deleteDialog.campaignTitle;
    const campaignId = deleteDialog.campaignId;

    setDeleteDialog({
      open: false,
      campaignId: "",
      campaignTitle: "",
      isDeleting: false,
    });

    try {
      await execute({
        title,
        undoSeconds: 3,
        loadingMessage: `Deleting "${title}"...`,
        action: async () => {
          await deleteCampaign(selectedBrandId, campaignId);
          // Invalidate brands query to refresh the UI
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: `"${title}" deleted successfully.`,
        errorMessage: `Failed to delete "${title}".`,
      });
    } catch {
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleArchive = async () => {
    if (!selectedBrandId) return;
    setArchiveDialog((prev) => ({ ...prev, isProcessing: true }));

    const shouldBeArchived = !archiveDialog.isArchived;
    const title = archiveDialog.campaignTitle;
    const campaignId = archiveDialog.campaignId;

    setArchiveDialog({
      open: false,
      campaignId: "",
      campaignTitle: "",
      isArchived: false,
      isProcessing: false,
    });

    try {
      await execute({
        title,
        undoSeconds: 3,
        loadingMessage: `${
          shouldBeArchived ? "Archiving" : "Unarchiving"
        } "${title}"...`,
        action: async () => {
          await updateCampaign(selectedBrandId, campaignId, {
            is_archived: shouldBeArchived,
          });
          // Invalidate brands query to refresh the UI
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: `"${title}" ${
          shouldBeArchived ? "archived" : "unarchived"
        } successfully.`,
        errorMessage: `Failed to ${
          shouldBeArchived ? "archive" : "unarchive"
        } "${title}".`,
      });
    } catch {
      setArchiveDialog((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // Drag handlers
  const handleCampaignDragStart = (
    e: React.DragEvent,
    campaignId: string,
    isArchived: boolean
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/campaign-drag",
      JSON.stringify({ campaignId, isArchived })
    );
    setDraggedCampaignId(campaignId);
  };

  const handleCampaignReorderDragOver = (
    e: React.DragEvent,
    targetCampaignId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const hasCampaignData = e.dataTransfer.types.includes(
      "application/campaign-drag"
    );
    if (!hasCampaignData) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? "before" : "after";

    setReorderTargetId(targetCampaignId);
    setDropPosition(position);
  };

  const handleAssetDragOver = (e: React.DragEvent, campaignId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const hasAssetData = e.dataTransfer.types.includes(
      "application/gallery-drag"
    );
    if (hasAssetData) {
      setDragOverCampaignId(campaignId);
    }
  };

  const handleSectionDragOver = (
    e: React.DragEvent,
    section: "active" | "archived"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const hasCampaignData = e.dataTransfer.types.includes(
      "application/campaign-drag"
    );
    if (hasCampaignData) {
      setDragOverSection(section);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverCampaignId(null);
      setDragOverSection(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedCampaignId(null);
    setDragOverCampaignId(null);
    setDragOverSection(null);
    setReorderTargetId(null);
    setDropPosition(null);
  };

  const handleCampaignReorderDrop = async (
    e: React.DragEvent,
    targetCampaignId: string,
    section: "active" | "archived"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedBrandId) {
      setReorderTargetId(null);
      setDropPosition(null);
      return;
    }

    try {
      const data = e.dataTransfer.getData("application/campaign-drag");
      if (!data) {
        setReorderTargetId(null);
        setDropPosition(null);
        return;
      }

      const { campaignId: draggedId, isArchived } = JSON.parse(data);

      // Don't reorder if dropped on itself
      if (draggedId === targetCampaignId) {
        setReorderTargetId(null);
        setDropPosition(null);
        return;
      }

      const targetIsArchived = section === "archived";
      const campaignList =
        section === "active" ? activeCampaigns : archivedCampaigns;

      // Calculate drop position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = e.clientY < midpoint ? "before" : "after";

      // Handle cross-section move (archive/unarchive with position)
      if (isArchived !== targetIsArchived) {
        const targetIndex = campaignList.findIndex(
          (c) => c.id === targetCampaignId
        );

        if (targetIndex === -1) {
          setReorderTargetId(null);
          setDropPosition(null);
          return;
        }

        // Calculate insert position for the new section
        let insertPosition = targetIndex;
        if (position === "after") {
          insertPosition = targetIndex + 1;
        }

        // Create new order for target section (inserting the dragged campaign)
        const reordered = [...campaignList];
        // Insert placeholder at the calculated position
        reordered.splice(insertPosition, 0, { id: draggedId } as any);

        // Update the dragged campaign's archive status and position
        await patchCampaign(selectedBrandId, draggedId, {
          is_archived: targetIsArchived,
          position: insertPosition,
        });

        // Update positions for all other campaigns in the target section
        const updatePromises = reordered
          .filter((c) => c.id !== draggedId)
          .map((campaign, index) => {
            const actualIndex = index >= insertPosition ? index + 1 : index;
            return patchCampaign(selectedBrandId, campaign.id, {
              position: actualIndex,
            });
          });

        await Promise.all(updatePromises);
        await queryClient.invalidateQueries({ queryKey: ["brands"] });

        toast.success(
          `Campaign moved to ${
            section === "active" ? "active" : "archived"
          } campaigns`
        );

        setReorderTargetId(null);
        setDropPosition(null);
        return;
      }

      // Handle same-section reordering
      const draggedIndex = campaignList.findIndex((c) => c.id === draggedId);
      const targetIndex = campaignList.findIndex(
        (c) => c.id === targetCampaignId
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        setReorderTargetId(null);
        setDropPosition(null);
        return;
      }

      // Create new order
      const reordered = [...campaignList];
      const [removed] = reordered.splice(draggedIndex, 1);

      let insertIndex = targetIndex;
      if (position === "after") {
        insertIndex =
          draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        insertIndex =
          draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }

      reordered.splice(insertIndex, 0, removed);

      // Update positions for all campaigns in this section
      const updatePromises = reordered.map((campaign, index) =>
        patchCampaign(selectedBrandId, campaign.id, { position: index })
      );

      await Promise.all(updatePromises);
      await queryClient.invalidateQueries({ queryKey: ["brands"] });

      toast.success("Campaign order updated");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to reorder campaigns");
    }

    setReorderTargetId(null);
    setDropPosition(null);
  };

  const handleAssetDropOnCampaign = async (
    e: React.DragEvent,
    campaignId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedBrandId) {
      setDragOverCampaignId(null);
      return;
    }

    try {
      const data = e.dataTransfer.getData("application/gallery-drag");
      if (!data || !galleryActions) {
        setDragOverCampaignId(null);
        return;
      }

      const payload = JSON.parse(data);
      if (!payload.itemIds || payload.itemIds.length === 0) {
        setDragOverCampaignId(null);
        return;
      }

      const items = galleryActions
        .getGalleryItems()
        .filter((item: any) => payload.itemIds.includes(item.id));

      if (items.length === 0) {
        toast.error("No items found to move");
        setDragOverCampaignId(null);
        return;
      }

      await Promise.all(
        items.map((item: any) =>
          galleryActions.patchItem?.({
            itemId: item.id,
            data: {
              campaign_id: campaignId,
              brand_id: selectedBrandId,
            },
            revalidateAutofillSuggestions: false,
          })
        )
      );
      setSelectedItems([]);

      const targetCampaign = campaigns.find((c) => c.id === campaignId);
      toast.success(
        `Successfully moved ${items.length} item(s) to campaign "${targetCampaign?.title}"`
      );
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Failed to move assets. Please try again.");
    }

    setDragOverCampaignId(null);
  };

  const handleCampaignDropOnSection = async (
    e: React.DragEvent,
    section: "active" | "archived"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedBrandId) {
      setDragOverSection(null);
      setDraggedCampaignId(null);
      return;
    }

    try {
      const data = e.dataTransfer.getData("application/campaign-drag");
      if (!data) {
        setDragOverSection(null);
        setDraggedCampaignId(null);
        return;
      }

      const { campaignId, isArchived: currentlyArchived } = JSON.parse(data);
      const shouldBeArchived = section === "archived";

      if (currentlyArchived === shouldBeArchived) {
        setDragOverSection(null);
        setDraggedCampaignId(null);
        return;
      }

      const campaign = campaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        toast.error("Campaign not found");
        setDragOverSection(null);
        setDraggedCampaignId(null);
        return;
      }

      const title = campaign.title;

      try {
        await execute({
          title,
          undoSeconds: 3,
          loadingMessage: `${
            shouldBeArchived ? "Archiving" : "Unarchiving"
          } "${title}"...`,
          action: async () => {
            await updateCampaign(selectedBrandId, campaignId, {
              is_archived: shouldBeArchived,
            });
            // Invalidate brands query to refresh the UI
            await queryClient.invalidateQueries({ queryKey: ["brands"] });
          },
          successMessage: `"${title}" ${
            shouldBeArchived ? "archived" : "unarchived"
          } successfully.`,
          errorMessage: `Failed to ${
            shouldBeArchived ? "archive" : "unarchive"
          } "${title}".`,
        });
      } catch {
        // Error already handled by useUndoableAction
      }
    } catch (error) {
      console.error("Archive error:", error);
    }

    setDragOverSection(null);
    setDraggedCampaignId(null);
  };

  if (!selectedBrandId) {
    return null;
  }

  if (isCollapsed)
    return (
      <div className="fixed mt-7 left-3 -translate-y-1/2 z-30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                className="mb-3"
                onClick={onToggleCollapsed}
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Open Camapign Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-[100%] w-[30%] rounded-sm">
      {/* Brand Selector and Title */}
      <div className="flex flex-col px-4 gap-y-3 mt-2">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Media library</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="ml-2 p-1"
                  onClick={onToggleCollapsed}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Close Camapign Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!hasNoBrands && (
          <BrandSelector
            showCampaigns={galleryView === "grid"}
            showSelectedValue
            className="bg-[#F3F4F6FF] hover:bg-[#F3F4F6FF] w-80"
            onBrandSelect={(brandId, campaignId) => {
              setSelectedFilters((prev) => ({
                ...prev,
                brandId: [brandId],
                campaigns: campaignId ? [campaignId] : [],
              }));
              setInitialBrandId(null);
              setSelectedCampaignInUrl(null);
            }}
          />
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 border-gray-200 mt-3">
        {selectedCampaignId ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCampaignSelect("");
              setSelectedCampaignId(null);
              if (orderBy === "brand_sort_order") {
                setOrderBy("created_at_descending");
              }
            }}
            className="text-sm font-semibold text-gray-900 hover:text-purple-600"
          >
            ← Go Back
          </Button>
        ) : (
          <h3 className="text-xl text-black truncate flex-1">Campaigns</h3>
        )}
      </div>

      {/* Search Bar */}
      <CampaignSidebarHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        brandId={selectedBrandId || ""}
        brandName={brandName}
        onCampaignCreated={onCampaignSelect}
      />

      {/* Campaigns List */}
      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["active"]}>
          {/* Active Campaigns */}
          <AccordionItem
            value="active"
            className={cn(
              "transition-colors",
              dragOverSection === "active" && "bg-purple-50"
            )}
            onDragOver={(e) => handleSectionDragOver(e, "active")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleCampaignDropOnSection(e, "active")}
          >
            <AccordionTrigger
              className={cn(
                "text-lg p-4 hover:no-underline font-medium text-gray-800",
                draggedCampaignId && "pointer-events-none"
              )}
              onDragOver={(e) => handleSectionDragOver(e, "active")}
              onDrop={(e) => handleCampaignDropOnSection(e, "active")}
            >
              <span className={cn(draggedCampaignId && "pointer-events-auto")}>
                Active Campaigns ({activeCampaigns.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="space-y-1 p-2"
                onDragOver={(e) => {
                  // Allow section drop when dragging campaigns
                  const hasCampaignData = e.dataTransfer.types.includes(
                    "application/campaign-drag"
                  );
                  if (hasCampaignData) {
                    handleSectionDragOver(e, "active");
                  }
                }}
                onDrop={(e) => {
                  // Allow section drop when dragging campaigns
                  const hasCampaignData = e.dataTransfer.types.includes(
                    "application/campaign-drag"
                  );
                  if (hasCampaignData) {
                    handleCampaignDropOnSection(e, "active");
                  }
                }}
              >
                {activeCampaigns.map((campaign) => (
                  <CampaignSidebarRow
                    key={`${selectedBrandId}-${campaign.id}`}
                    campaign={campaign}
                    selectedBrandId={selectedBrandId}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignSelect={onCampaignSelect}
                    count={countData?.count_by_campaign?.[campaign.id]}
                    isCountLoading={isCountLoading}
                    onRename={(id, title) =>
                      setRenameDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                      })
                    }
                    onArchiveToggle={(id, title, isArchived) =>
                      setArchiveDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                        isArchived,
                        isProcessing: false,
                      })
                    }
                    onDelete={(id, title) =>
                      setDeleteDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                        isDeleting: false,
                      })
                    }
                    onAssetDragOver={handleAssetDragOver}
                    onDragLeave={handleDragLeave}
                    onAssetDrop={handleAssetDropOnCampaign}
                    isDraggedOver={dragOverCampaignId === campaign.id}
                    onCampaignDragStart={handleCampaignDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedCampaignId === campaign.id}
                    onSectionDragOver={handleSectionDragOver}
                    onSectionDrop={handleCampaignDropOnSection}
                    onReorderDragOver={handleCampaignReorderDragOver}
                    onReorderDrop={handleCampaignReorderDrop}
                    isReorderTarget={reorderTargetId === campaign.id}
                    dropPosition={
                      reorderTargetId === campaign.id ? dropPosition : null
                    }
                  />
                ))}
                {activeCampaigns.length === 0 && (
                  <p className="text-sm text-gray-500 px-3 py-2">
                    No active campaigns.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Archived Campaigns */}
          <AccordionItem
            value="archived"
            className={cn(
              "transition-colors",
              dragOverSection === "archived" && "bg-gray-100"
            )}
            onDragOver={(e) => handleSectionDragOver(e, "archived")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleCampaignDropOnSection(e, "archived")}
          >
            <AccordionTrigger
              className={cn(
                "text-lg p-4 hover:no-underline font-medium text-gray-800",
                draggedCampaignId && "pointer-events-none"
              )}
              onDragOver={(e) => handleSectionDragOver(e, "archived")}
              onDrop={(e) => handleCampaignDropOnSection(e, "archived")}
            >
              <span className={cn(draggedCampaignId && "pointer-events-auto")}>
                Archived Campaigns ({archivedCampaigns.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="space-y-1 p-2"
                onDragOver={(e) => {
                  // Allow section drop when dragging campaigns
                  const hasCampaignData = e.dataTransfer.types.includes(
                    "application/campaign-drag"
                  );
                  if (hasCampaignData) {
                    handleSectionDragOver(e, "archived");
                  }
                }}
                onDrop={(e) => {
                  // Allow section drop when dragging campaigns
                  const hasCampaignData = e.dataTransfer.types.includes(
                    "application/campaign-drag"
                  );
                  if (hasCampaignData) {
                    handleCampaignDropOnSection(e, "archived");
                  }
                }}
              >
                {archivedCampaigns.map((campaign) => (
                  <CampaignSidebarRow
                    key={`${selectedBrandId}-${campaign.id}`}
                    campaign={campaign}
                    selectedBrandId={selectedBrandId}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignSelect={onCampaignSelect}
                    count={countData?.count_by_campaign?.[campaign.id]}
                    isCountLoading={isCountLoading}
                    onRename={(id, title) =>
                      setRenameDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                      })
                    }
                    onArchiveToggle={(id, title, isArchived) =>
                      setArchiveDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                        isArchived,
                        isProcessing: false,
                      })
                    }
                    onDelete={(id, title) =>
                      setDeleteDialog({
                        open: true,
                        campaignId: id,
                        campaignTitle: title,
                        isDeleting: false,
                      })
                    }
                    onAssetDragOver={handleAssetDragOver}
                    onDragLeave={handleDragLeave}
                    onAssetDrop={handleAssetDropOnCampaign}
                    isDraggedOver={dragOverCampaignId === campaign.id}
                    onCampaignDragStart={handleCampaignDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedCampaignId === campaign.id}
                    onSectionDragOver={handleSectionDragOver}
                    onSectionDrop={handleCampaignDropOnSection}
                    onReorderDragOver={handleCampaignReorderDragOver}
                    onReorderDrop={handleCampaignReorderDrop}
                    isReorderTarget={reorderTargetId === campaign.id}
                    dropPosition={
                      reorderTargetId === campaign.id ? dropPosition : null
                    }
                  />
                ))}
                {archivedCampaigns.length === 0 && (
                  <p className="text-sm text-gray-500 px-3 py-2">
                    No archived campaigns.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Dialogs */}
      <CampaignSidebarRenameDialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog({ open, campaignId: "", campaignTitle: "" })
        }
        brandId={selectedBrandId}
        campaignId={renameDialog.campaignId}
        campaignTitle={renameDialog.campaignTitle}
      />

      <ReusableAlertDialog
        open={archiveDialog.open}
        onOpenChange={(open) =>
          setArchiveDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isArchived: false,
            isProcessing: false,
          })
        }
        title={
          archiveDialog.isArchived ? "Unarchive Campaign" : "Archive Campaign"
        }
        description={
          <>
            Are you sure you want to{" "}
            {archiveDialog.isArchived ? "unarchive" : "move"}{" "}
            <span className="font-semibold text-gray-900">
              &quot;{archiveDialog.campaignTitle}&quot;
            </span>{" "}
            {archiveDialog.isArchived
              ? "back to active campaigns?"
              : "to the archive?"}
          </>
        }
        confirmLabel={archiveDialog.isArchived ? "Unarchive" : "Archive"}
        onConfirm={handleArchive}
        isLoading={archiveDialog.isProcessing}
      />

      <ReusableAlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isDeleting: false,
          })
        }
        title="Delete Campaign"
        description={
          <>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-gray-900">
              &quot;{deleteDialog.campaignTitle}&quot;
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteDialog.isDeleting}
        danger
      />
    </div>
  );
}
