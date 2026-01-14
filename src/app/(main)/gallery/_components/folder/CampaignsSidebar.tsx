"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/store/brand.store";
import { useCampaignMutations } from "@/hooks/useCampaignMutations";
import { useSubfolderMutations } from "@/hooks/useSubfolderMutations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { useCampaignCounts } from "@/hooks/useCampaigns";
import { GalleryActions } from "@/hooks/useGallery";
import { useBrandBrainAnalysis } from "@/hooks/useBrandBrainAnalysis";
import { useCampaignAnalyzingStatus } from "@/hooks/sse/useCampaignAnalyzingStatus";
import { CampaignSidebarHeader } from "./CampaignSidebarHeader";
import { CampaignSidebarRow } from "./CampaignSidebarRow";
import { CampaignDialogs } from "./CampaignDialogs";
import BrandSelector from "@/components/chatbot/brands/BrandSelector";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DroppableSectionHeader } from "./CampaignDroppableSectionHeader";

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
  setInitialBrandId,
  setSelectedCampaignInUrl,
  setSelectedFilters,
  hasNoBrands,
  galleryView,
  isCollapsed,
  onToggleCollapsed,
}: CampaignsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brands } = useBrandStore();
  const { setSelectedCampaignIdInGallery: setSelectedCampaignId } =
    useBrandStore();
  const { orderBy, setOrderBy, selectedSubFolderId, setSelectedSubFolderId } =
    useGalleryFilterStore();

  // Mutations
  const {
    updateCampaign,
    deleteCampaign,
    setCampaignCuration,
    duplicateCampaign,
  } = useCampaignMutations();

  const { updateSubfolder: updateSubfolderMutation, duplicateSubfolder } =
    useSubfolderMutations();

  // Subscribe to real-time campaign analyzing status updates via SSE
  useCampaignAnalyzingStatus();

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

  const [analyzeDialog, setAnalyzeDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isReanalysis: boolean;
  }>({ open: false, campaignId: "", campaignTitle: "", isReanalysis: false });

  const [curatedDialog, setCuratedDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isCurated: boolean;
    isProcessing: boolean;
  }>({
    open: false,
    campaignId: "",
    campaignTitle: "",
    isCurated: false,
    isProcessing: false,
  });

  // Brand Brain Analysis mutation
  const { mutate: triggerAnalysis, isPending: isAnalyzing } =
    useBrandBrainAnalysis({
      onSuccess: () => {
        setAnalyzeDialog({
          open: false,
          campaignId: "",
          campaignTitle: "",
          isReanalysis: false,
        });
      },
    });

  // Fetch campaign counts
  const { data: countData, isLoading: isCountLoading } =
    useCampaignCounts(selectedBrandId);

  const { campaigns } = useMemo(() => {
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

  // Get IDs for SortableContext
  const activeCampaignIds = useMemo(
    () => activeCampaigns.map((c) => c.id),
    [activeCampaigns]
  );
  const archivedCampaignIds = useMemo(
    () => archivedCampaigns.map((c) => c.id),
    [archivedCampaigns]
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
      await deleteCampaign({
        brandId: selectedBrandId,
        campaignId,
        title,
        undoSeconds: 3,
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
      await updateCampaign({
        brandId: selectedBrandId,
        campaignId,
        payload: { is_archived: shouldBeArchived },
        title,
        undoSeconds: 3,
      });
    } finally {
      setArchiveDialog((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handleAnalyze = () => {
    if (!selectedBrandId || !analyzeDialog.campaignId) return;

    triggerAnalysis({
      brand_id: selectedBrandId,
      campaign_id: analyzeDialog.campaignId,
      batch_size: 10,
    });
  };

  const handleCuratedToggle = async () => {
    if (!selectedBrandId) return;
    setCuratedDialog((prev) => ({ ...prev, isProcessing: true }));

    const shouldBeCurated = !curatedDialog.isCurated;
    const title = curatedDialog.campaignTitle;
    const campaignId = curatedDialog.campaignId;

    setCuratedDialog({
      open: false,
      campaignId: "",
      campaignTitle: "",
      isCurated: false,
      isProcessing: false,
    });

    try {
      await setCampaignCuration({
        brandId: selectedBrandId,
        campaignId,
        isCurated: shouldBeCurated,
        title,
        undoSeconds: 3,
      });
    } catch {
      setCuratedDialog((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const handleKKFolderToggle = async (
    campaignId: string,
    title: string,
    isKKFolder: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeKKFolder = !isKKFolder;

    if (subfolderId) {
      await updateSubfolderMutation({
        brandId: selectedBrandId,
        campaignId,
        subFolderId: subfolderId,
        payload: { is_kk_folder: shouldBeKKFolder },
        title,
        undoSeconds: 3,
      });
      return;
    }

    await updateCampaign({
      brandId: selectedBrandId,
      campaignId,
      payload: { is_kk_folder: shouldBeKKFolder },
      title,
    });
  };

  const handleKKSelectedToggle = async (
    campaignId: string,
    title: string,
    isKKSelected: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeKKSelected = !isKKSelected;

    if (subfolderId) {
      await updateSubfolderMutation({
        brandId: selectedBrandId,
        campaignId,
        subFolderId: subfolderId,
        payload: { is_kk_selected: shouldBeKKSelected },
        title,
        undoSeconds: 3,
      });
      return;
    }

    await updateCampaign({
      brandId: selectedBrandId,
      campaignId,
      payload: { is_kk_selected: shouldBeKKSelected },
      title,
    });
  };

  const handleAdminOnlyToggle = async (
    campaignId: string,
    title: string,
    isAdminOnly: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeAdminOnly = !isAdminOnly;

    if (subfolderId) {
      await updateSubfolderMutation({
        brandId: selectedBrandId,
        campaignId,
        subFolderId: subfolderId,
        payload: { is_admin_only: shouldBeAdminOnly },
        title,
        undoSeconds: 3,
      });
      return;
    }

    await updateCampaign({
      brandId: selectedBrandId,
      campaignId,
      payload: { is_admin_only: shouldBeAdminOnly },
      title,
    });
  };

  const handleCampaignDuplicate = async (id: string, title: string) => {
    if (!selectedBrandId) return;

    try {
      await duplicateCampaign({
        brandId: selectedBrandId,
        campaignId: id,
        title,
      });
    } catch (error) {
      console.error("Error duplicating campaign:", error);
    }
  };

  const handleSubfolderDuplicate = async (
    campaignId: string,
    subFolderId: string,
    title: string
  ) => {
    if (!selectedBrandId) return;

    try {
      await duplicateSubfolder({
        brandId: selectedBrandId,
        campaignId,
        subFolderId,
        title,
      });
    } catch (error) {
      console.error("Error duplicating subfolder:", error);
    }
  };

  const handleRename = (id: string, title: string) => {
    setRenameDialog({
      open: true,
      campaignId: id,
      campaignTitle: title,
    });
  };

  const handleArchiveDialog = (
    id: string,
    title: string,
    isArchived: boolean
  ) => {
    setArchiveDialog({
      open: true,
      campaignId: id,
      campaignTitle: title,
      isArchived,
      isProcessing: false,
    });
  };

  const handleCuratedDialog = (
    id: string,
    title: string,
    isCurated: boolean
  ) => {
    setCuratedDialog({
      open: true,
      campaignId: id,
      campaignTitle: title,
      isCurated,
      isProcessing: false,
    });
  };

  const handleDeleteDialog = (id: string, title: string) => {
    setDeleteDialog({
      open: true,
      campaignId: id,
      campaignTitle: title,
      isDeleting: false,
    });
  };

  const handleAnalyzeDialog = (id: string, title: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    setAnalyzeDialog({
      open: true,
      campaignId: id,
      campaignTitle: title,
      isReanalysis: campaign?.is_curated_for_brand || false,
    });
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
                className="mb-3 rounded-2xl"
                onClick={onToggleCollapsed}
                size="xs"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Open Campaign Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-[100%] min-w-[320px] max-w-[450px] w-[28vw] lg:w-[26vw] xl:w-[24vw] rounded-sm">
      {/* Brand Selector and Title */}
      <div className="flex flex-col px-4 gap-y-3 mt-2">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Media library</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="xs"
                  className="rounded-2xl"
                  onClick={onToggleCollapsed}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Close Campaign Sidebar</p>
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
              setSelectedSubFolderId(null);
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
      />

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Accordion type="multiple" defaultValue={["active"]}>
          {/* Active Campaigns */}
          <AccordionItem value="active">
            <AccordionTrigger className="text-lg p-4 hover:no-underline font-medium text-gray-800">
              <DroppableSectionHeader
                section="active"
                label="Active Campaigns"
                count={activeCampaigns.length}
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
                <SortableContext
                  items={activeCampaignIds}
                  strategy={verticalListSortingStrategy}
                >
                  {activeCampaigns.map((campaign) => (
                    <CampaignSidebarRow
                      key={`${selectedBrandId}-${campaign.id}`}
                      campaign={campaign}
                      selectedBrandId={selectedBrandId}
                      selectedCampaignId={selectedCampaignId}
                      selectedSubFolderId={selectedSubFolderId}
                      onCampaignSelect={(campaignId, subFolderId) => {
                        onCampaignSelect(campaignId);
                        setSelectedSubFolderId(subFolderId || null);
                      }}
                      count={countData?.count_by_campaign?.[campaign.id]}
                      subfolderCounts={countData?.count_by_sub_folder}
                      isCountLoading={isCountLoading}
                      onRename={handleRename}
                      onArchiveToggle={handleArchiveDialog}
                      onCuratedToggle={handleCuratedDialog}
                      onKKFolderToggle={handleKKFolderToggle}
                      onKKSelectedToggle={handleKKSelectedToggle}
                      onAdminOnlyToggle={handleAdminOnlyToggle}
                      onDelete={handleDeleteDialog}
                      onAnalyze={handleAnalyzeDialog}
                      onDuplicate={handleCampaignDuplicate}
                      onSubfolderDuplicate={handleSubfolderDuplicate}
                    />
                  ))}
                </SortableContext>
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
            <AccordionTrigger className="text-lg p-4 hover:no-underline font-medium text-gray-800">
              <DroppableSectionHeader
                section="archived"
                label="Archived Campaigns"
                count={archivedCampaigns.length}
              />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
                <SortableContext
                  items={archivedCampaignIds}
                  strategy={verticalListSortingStrategy}
                >
                  {archivedCampaigns.map((campaign) => (
                    <CampaignSidebarRow
                      key={`${selectedBrandId}-${campaign.id}`}
                      campaign={campaign}
                      selectedBrandId={selectedBrandId}
                      selectedCampaignId={selectedCampaignId}
                      selectedSubFolderId={selectedSubFolderId}
                      onCampaignSelect={(campaignId, subFolderId) => {
                        onCampaignSelect(campaignId);
                        setSelectedSubFolderId(subFolderId || null);
                      }}
                      count={countData?.count_by_campaign?.[campaign.id]}
                      subfolderCounts={countData?.count_by_sub_folder}
                      isCountLoading={isCountLoading}
                      onRename={handleRename}
                      onArchiveToggle={handleArchiveDialog}
                      onCuratedToggle={handleCuratedDialog}
                      onKKFolderToggle={handleKKFolderToggle}
                      onKKSelectedToggle={handleKKSelectedToggle}
                      onAdminOnlyToggle={handleAdminOnlyToggle}
                      onDelete={handleDeleteDialog}
                      onAnalyze={handleAnalyzeDialog}
                      onDuplicate={handleCampaignDuplicate}
                      onSubfolderDuplicate={handleSubfolderDuplicate}
                    />
                  ))}
                </SortableContext>
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
      <CampaignDialogs
        selectedBrandId={selectedBrandId}
        renameDialog={renameDialog}
        setRenameDialog={setRenameDialog}
        archiveDialog={archiveDialog}
        setArchiveDialog={setArchiveDialog}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        analyzeDialog={analyzeDialog}
        setAnalyzeDialog={setAnalyzeDialog}
        curatedDialog={curatedDialog}
        setCuratedDialog={setCuratedDialog}
        isAnalyzing={isAnalyzing}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
        onCuratedToggle={handleCuratedToggle}
      />
    </div>
  );
}
