"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useBrandStore } from "@/store/brand.store";
import {
  deleteCampaign,
  updateCampaign,
  setCampaignCuration,
} from "@/services/api/brand.service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { useCampaignCounts } from "@/hooks/useCampaignCounts";
import { GalleryActions } from "@/hooks/useGallery";
import { useBrandBrainAnalysis } from "@/hooks/useBrandBrainAnalysis";
import { useCampaignAnalyzingStatus } from "@/hooks/sse/useCampaignAnalyzingStatus";
import { CampaignSidebarHeader } from "./CampaignSidebarHeader";
import { CampaignSidebarRow } from "./CampaignSidebarRow";
import { CampaignDialogs } from "./CampaignDialogs";
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
  const { brands, archiveCampaign } = useBrandStore();
  const { setSelectedCampaignId } = useBrandStore();
  const { orderBy, setOrderBy, selectedSubFolderId, setSelectedSubFolderId } =
    useGalleryFilterStore();
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();

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

  // Instantly update gallery when a campaign is archived/unarchived
  const updateGalleryForCampaignArchive = (
    campaignId: string,
    shouldBeArchived: boolean
  ) => {
    queryClient.setQueriesData({ queryKey: ["gallery-items"] }, (old: any) => {
      if (!old?.pages) return old;

      return {
        ...old,
        pages: old.pages.map((page: any) => {
          const itemsInThisCampaign = page.gallery_items.filter(
            (item: any) => item.campaign_id === campaignId
          );

          // If we're archiving → remove them
          // If we're unarchiving → keep them (they should now appear)
          const shouldKeep = !shouldBeArchived;

          return {
            ...page,
            gallery_items: shouldKeep
              ? page.gallery_items
              : page.gallery_items.filter(
                  (item: any) => item.campaign_id !== campaignId
                ),
            pagination: {
              ...page.pagination,
              total: shouldKeep
                ? page.pagination.total
                : Math.max(
                    0,
                    page.pagination.total - itemsInThisCampaign.length
                  ),
            },
          };
        }),
      };
    });
  };

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

    // Optimistically update the store immediately
    archiveCampaign(selectedBrandId, campaignId, shouldBeArchived);

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
          updateGalleryForCampaignArchive(campaignId, shouldBeArchived);
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
      await execute({
        title,
        undoSeconds: 3,
        loadingMessage: `${
          shouldBeCurated ? "Marking" : "Unmarking"
        } "${title}" as curated campaign...`,
        action: async () => {
          await setCampaignCuration(
            selectedBrandId,
            campaignId,
            shouldBeCurated
          );
          // Invalidate brands query to refresh the UI
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: `"${title}" ${
          shouldBeCurated ? "marked" : "unmarked"
        } as curated campaign successfully.`,
        errorMessage: `Failed to ${
          shouldBeCurated ? "mark" : "unmark"
        } "${title}" as curated campaign.`,
      });
    } catch {
      setCuratedDialog((prev) => ({ ...prev, isProcessing: false }));
    }
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
      <div className="flex-1 overflow-y-auto">
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
                      onCuratedToggle={(id, title, isCurated) =>
                        setCuratedDialog({
                          open: true,
                          campaignId: id,
                          campaignTitle: title,
                          isCurated,
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
                      onAnalyze={(id, title) => {
                        const campaign = campaigns.find((c) => c.id === id);
                        setAnalyzeDialog({
                          open: true,
                          campaignId: id,
                          campaignTitle: title,
                          isReanalysis: campaign?.is_curated_for_brand || false,
                        });
                      }}
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
                      onCuratedToggle={(id, title, isCurated) =>
                        setCuratedDialog({
                          open: true,
                          campaignId: id,
                          campaignTitle: title,
                          isCurated,
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
                      onAnalyze={(id, title) => {
                        const campaign = campaigns.find((c) => c.id === id);
                        setAnalyzeDialog({
                          open: true,
                          campaignId: id,
                          campaignTitle: title,
                          isReanalysis: campaign?.is_curated_for_brand || false,
                        });
                      }}
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
