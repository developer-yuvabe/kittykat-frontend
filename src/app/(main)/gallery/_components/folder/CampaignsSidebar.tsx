"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/store/brand.store";
import { cn } from "@/lib/utils";
import { deleteCampaign, updateCampaign } from "@/services/api/brand.service";
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

interface CampaignsSidebarProps {
  selectedBrandId: string;
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string) => void;
  galleryActions?: GalleryActions;
}

export function CampaignsSidebar({
  selectedBrandId,
  selectedCampaignId,
  onCampaignSelect,
  galleryActions,
}: CampaignsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brands } = useBrandStore();
  const { setSelectedCampaignId } = useBrandStore();
  const { orderBy, setOrderBy } = useGalleryFilterStore();
  const queryClient = useQueryClient();

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

  const activeCampaigns = filteredCampaigns.filter((c) => !c.is_archived);
  const archivedCampaigns = filteredCampaigns.filter((c) => c.is_archived);

  // Handlers
  const handleDelete = async () => {
    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteCampaign(selectedBrandId, deleteDialog.campaignId);
      toast.success(`"${deleteDialog.campaignTitle}" deleted successfully.`);
      setDeleteDialog({
        open: false,
        campaignId: "",
        campaignTitle: "",
        isDeleting: false,
      });
    } catch (error) {
      toast.error("Failed to delete campaign.");
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleArchive = async () => {
    setArchiveDialog((prev) => ({ ...prev, isProcessing: true }));

    const shouldBeArchived = !archiveDialog.isArchived;
    const action = shouldBeArchived ? "archived" : "unarchived";

    try {
      await updateCampaign(selectedBrandId, archiveDialog.campaignId, {
        is_archived: shouldBeArchived,
      });

      // Invalidate brands query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["brands"] });

      toast.success(`"${archiveDialog.campaignTitle}" ${action} successfully.`);
      setArchiveDialog({
        open: false,
        campaignId: "",
        campaignTitle: "",
        isArchived: false,
        isProcessing: false,
      });
    } catch (error) {
      toast.error(`Failed to ${action.slice(0, -1)} campaign.`);
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
  };

  const handleAssetDropOnCampaign = async (
    e: React.DragEvent,
    campaignId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

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

      const targetCampaign = campaigns.find((c) => c.id === campaignId);
      toast.success(
        `Successfully moved ${items.length} item(s) to campaign "${targetCampaign?.title}"`
      );

      galleryActions.refetchGalleryItems();
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

      const action = shouldBeArchived ? "archived" : "unarchived";

      try {
        await updateCampaign(selectedBrandId, campaignId, {
          is_archived: shouldBeArchived,
        });

        // Invalidate brands query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["brands"] });

        toast.success(`"${campaign.title}" ${action} successfully.`);
      } catch (error) {
        toast.error(`Failed to ${action.slice(0, -1)} campaign.`);
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

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-[99%] w-1/3 rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
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
          <h3 className="text-2xl font-semibold text-gray-900 truncate flex-1">
            Campaigns
          </h3>
        )}
      </div>

      {/* Search Bar */}
      <CampaignSidebarHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        brandId={selectedBrandId}
        brandName={brandName}
        onCampaignCreated={onCampaignSelect}
      />

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["active"]}>
          {/* Active Campaigns */}
          <AccordionItem value="active">
            <AccordionTrigger
              className={cn(
                "text-lg p-4 hover:no-underline font-medium text-gray-800",
                dragOverSection === "active" && "bg-purple-50"
              )}
              onDragOver={(e) => handleSectionDragOver(e, "active")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleCampaignDropOnSection(e, "active")}
            >
              Active Campaigns ({activeCampaigns.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
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
          <AccordionItem value="archived">
            <AccordionTrigger
              className={cn(
                "text-lg p-4 hover:no-underline font-medium text-gray-800",
                dragOverSection === "archived" && "bg-gray-100"
              )}
              onDragOver={(e) => handleSectionDragOver(e, "archived")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleCampaignDropOnSection(e, "archived")}
            >
              Archived Campaigns ({archivedCampaigns.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
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
              "{archiveDialog.campaignTitle}"
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
              "{deleteDialog.campaignTitle}"
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
