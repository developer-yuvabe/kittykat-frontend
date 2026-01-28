"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Palette,
  Package,
  Image,
  Folder as FolderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useCampaignCounts } from "@/hooks/useCampaigns";
import { useCampaignAnalyzingStatus } from "@/hooks/sse/useCampaignAnalyzingStatus";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import BrandSelector from "@/components/chatbot/brands/BrandSelector";
import { CampaignSidebarHeader } from "./CampaignSidebarHeader";
import { CampaignSidebarRow } from "./CampaignSidebarRow";
import { CampaignDialogs } from "./CampaignDialogs";
import { DroppableSectionHeader } from "./CampaignDroppableSectionHeader";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useCampaignMutations } from "@/hooks/useCampaignMutations";
import { useSubfolderMutations } from "@/hooks/useSubfolderMutations";
import { useBrandBrainAnalysis } from "@/hooks/useBrandBrainAnalysis";
import { CreateCampaignDialog } from "@/components/gallery/CreateCampaignDialog";

interface GallerySidebarProps {
  selectedBrandId: string | null;
  selectedCampaignId: string | null;
  activeTab: string;
  onCampaignSelect: (campaignId: string) => void;
  onTabChange: (tab: string) => void;
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
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isMediaSelectDialog?: boolean;
}

// System folder configuration
const systemFolders = [
  { id: "brand-uploads", label: "Brand Uploads", icon: Upload },
  { id: "moodboard", label: "Moodboards", icon: Palette },
  { id: "products", label: "Products", icon: Package },
  { id: "pexels", label: "Pexels", icon: Image },
];

export function GallerySidebar({
  selectedBrandId,
  selectedCampaignId,
  activeTab,
  onCampaignSelect,
  onTabChange,
  setInitialBrandId,
  setSelectedCampaignInUrl,
  setSelectedFilters,
  hasNoBrands,
  isCollapsed,
  onToggleCollapsed,
  isMediaSelectDialog = false,
}: GallerySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brands, setSelectedCampaignId, setDialogCampaignId } =
    useBrandStore();
  const { selectedSubFolderId, setSelectedSubFolderId } =
    useGalleryFilterStore();

  // Use the appropriate setter based on dialog mode
  const handleSetCampaignId = isMediaSelectDialog
    ? setDialogCampaignId
    : setSelectedCampaignId;

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

  // Dialog states
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

  // Sort campaigns by position
  const sortByPosition = (campaignList: typeof campaigns) => {
    return [...campaignList].sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      if (a.position !== undefined) return -1;
      if (b.position !== undefined) return 1;
      return 0;
    });
  };

  const activeCampaigns = sortByPosition(
    filteredCampaigns.filter((c) => !c.is_archived)
  );
  const archivedCampaigns = sortByPosition(
    filteredCampaigns.filter((c) => c.is_archived)
  );

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
    id: string,
    title: string,
    isKKFolder: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeKKFolder = !isKKFolder;

    try {
      if (subfolderId) {
        await updateSubfolderMutation({
          brandId: selectedBrandId,
          campaignId: id,
          subFolderId: subfolderId,
          payload: { is_kk_folder: shouldBeKKFolder },
        });
      } else {
        await updateCampaign({
          brandId: selectedBrandId,
          campaignId: id,
          payload: { is_kk_folder: shouldBeKKFolder },
          title,
        });
      }
    } catch (error) {
      console.error("Error toggling KK folder:", error);
    }
  };

  const handleKKSelectedToggle = async (
    id: string,
    title: string,
    isKKSelected: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeKKSelected = !isKKSelected;

    try {
      if (subfolderId) {
        await updateSubfolderMutation({
          brandId: selectedBrandId,
          campaignId: id,
          subFolderId: subfolderId,
          payload: { is_kk_selected: shouldBeKKSelected },
        });
      } else {
        await updateCampaign({
          brandId: selectedBrandId,
          campaignId: id,
          payload: { is_kk_selected: shouldBeKKSelected },
          title,
        });
      }
    } catch (error) {
      console.error("Error toggling KK selected:", error);
    }
  };

  const handleAdminOnlyToggle = async (
    id: string,
    title: string,
    isAdminOnly: boolean,
    subfolderId?: string
  ) => {
    if (!selectedBrandId) return;

    const shouldBeAdminOnly = !isAdminOnly;

    try {
      if (subfolderId) {
        await updateSubfolderMutation({
          brandId: selectedBrandId,
          campaignId: id,
          subFolderId: subfolderId,
          payload: { is_admin_only: shouldBeAdminOnly },
        });
      } else {
        await updateCampaign({
          brandId: selectedBrandId,
          campaignId: id,
          payload: { is_admin_only: shouldBeAdminOnly },
          title,
        });
      }
    } catch (error) {
      console.error("Error toggling admin only:", error);
    }
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

  // Collapsed state
  if (isCollapsed) {
    return (
      <div className="fixed mt-7 left-3 -translate-y-1/2 z-30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  className="mb-3 rounded-2xl"
                  onClick={onToggleCollapsed}
                  size="xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Open Media Library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-full min-h-0 min-w-[300px] w-[22vw] rounded-sm">
      {/* Header */}
      <div className="flex flex-col px-4 gap-y-3 mt-2">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Media library</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="default"
                    size="xs"
                    className="rounded-2xl"
                    onClick={onToggleCollapsed}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Close Media Library</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Brand Selector */}
        {!hasNoBrands && !isMediaSelectDialog && (
          <BrandSelector
            showCampaigns={false}
            showSelectedValue
            className="bg-[#F3F4F6FF] hover:bg-[#F3F4F6FF] w-64"
            onBrandSelect={(brandId) => {
              setSelectedFilters((prev) => ({
                ...prev,
                brandId: [brandId],
                campaigns: [],
              }));
              setInitialBrandId(null);
              setSelectedCampaignInUrl(null);
              onCampaignSelect("");
              handleSetCampaignId(null);
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 min-h-0 mt-4">
        <div className="px-4 space-y-6 w-full min-w-0 overflow-hidden">
          {/* System Folders Section */}
          <div>
            <div className="space-y-0.5">
              {/* Seperte All media button */}
              <button
                key="all-media"
                onClick={() => {
                  onTabChange("all-media");
                  onCampaignSelect("");
                  handleSetCampaignId(null);
                  setSelectedSubFolderId(null);
                  setSelectedFilters((prev) => ({
                    ...prev,
                    campaigns: [],
                    sub_folders: [],
                  }));
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors",
                  activeTab === "all-media"
                    ? "bg-[#636AE8]/10 text-[#636AE8] font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <FolderIcon className="h-4 w-4" />
                <span>All Media</span>
              </button>
            </div>

            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider my-2 px-3">
              Library
            </h3>
            <div className="space-y-0.5">
              {systemFolders.map((folder) => {
                const Icon = folder.icon;
                const isActive = activeTab === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onTabChange(folder.id);
                      onCampaignSelect("");
                      handleSetCampaignId(null);
                      setSelectedSubFolderId(null);
                      setSelectedFilters((prev) => ({
                        ...prev,
                        campaigns: [],
                        sub_folders: [],
                      }));
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors",
                      isActive
                        ? "bg-[#636AE8]/10 text-[#636AE8] font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{folder.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campaign Folders Section */}
          {selectedBrandId && (
            <div>
              <div className="flex flex-row justify-between ">
                <h3 className="text-xs font-bold text-gray-500 mb-2">
                  Campaign Folders
                </h3>
                <div className="mr-4">
                  <CreateCampaignDialog
                    brandId={selectedBrandId!}
                    brandName={brandName}
                    onCampaignCreated={onCampaignSelect}
                  />
                </div>
              </div>
              {/* Search Bar */}
              <CampaignSidebarHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />

              {/* Campaigns List */}
              <Accordion
                type="multiple"
                defaultValue={["active"]}
                className="mt-1"
              >
                {/* Active Campaigns */}
                <AccordionItem value="active">
                  <AccordionTrigger className="text-xs py-3 hover:no-underline font-medium text-gray-600">
                    <DroppableSectionHeader
                      section="active"
                      label="Active Campaigns"
                      count={activeCampaigns.length}
                    />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
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
                              handleSetCampaignId(campaignId);
                              setSelectedSubFolderId(subFolderId || null);
                              setSelectedFilters((prev) => ({
                                ...prev,
                                campaigns: [campaignId],
                                sub_folders: subFolderId ? [subFolderId] : [],
                              }));
                              onTabChange("all-media");
                            }}
                            count={countData?.count_by_campaign?.[campaign.id]}
                            subfolderCounts={countData?.count_by_sub_folder}
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
                            onKKFolderToggle={(
                              id,
                              title,
                              isKKFolder,
                              subfolderId
                            ) =>
                              handleKKFolderToggle(
                                id,
                                title,
                                isKKFolder,
                                subfolderId
                              )
                            }
                            onKKSelectedToggle={(
                              id,
                              title,
                              isKKSelected,
                              subfolderId
                            ) =>
                              handleKKSelectedToggle(
                                id,
                                title,
                                isKKSelected,
                                subfolderId
                              )
                            }
                            onAdminOnlyToggle={(
                              id,
                              title,
                              isAdminOnly,
                              subfolderId
                            ) =>
                              handleAdminOnlyToggle(
                                id,
                                title,
                                isAdminOnly,
                                subfolderId
                              )
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
                              const campaign = campaigns.find(
                                (c) => c.id === id
                              );
                              setAnalyzeDialog({
                                open: true,
                                campaignId: id,
                                campaignTitle: title,
                                isReanalysis:
                                  campaign?.is_curated_for_brand || false,
                              });
                            }}
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
                  <AccordionTrigger className="text-xs py-3 hover:no-underline font-medium text-gray-600">
                    <DroppableSectionHeader
                      section="archived"
                      label="Archived Campaigns"
                      count={archivedCampaigns.length}
                    />
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      <SortableContext
                        items={archivedCampaignIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {archivedCampaigns.map((campaign) => (
                          <CampaignSidebarRow
                            selectedSubFolderId={selectedSubFolderId}
                            key={`${selectedBrandId}-${campaign.id}`}
                            campaign={campaign}
                            selectedBrandId={selectedBrandId}
                            selectedCampaignId={selectedCampaignId}
                            onCampaignSelect={(campaignId, subFolderId) => {
                              onCampaignSelect(campaignId);
                              handleSetCampaignId(campaignId);
                              setSelectedSubFolderId(subFolderId || null);
                              setSelectedFilters((prev) => ({
                                ...prev,
                                campaigns: [campaignId],
                                sub_folders: subFolderId ? [subFolderId] : [],
                              }));
                              onTabChange("all-media");
                            }}
                            count={countData?.count_by_campaign?.[campaign.id]}
                            subfolderCounts={countData?.count_by_sub_folder}
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
                            onKKFolderToggle={(
                              id,
                              title,
                              isKKFolder,
                              subfolderId
                            ) =>
                              handleKKFolderToggle(
                                id,
                                title,
                                isKKFolder,
                                subfolderId
                              )
                            }
                            onKKSelectedToggle={(
                              id,
                              title,
                              isKKSelected,
                              subfolderId
                            ) =>
                              handleKKSelectedToggle(
                                id,
                                title,
                                isKKSelected,
                                subfolderId
                              )
                            }
                            onAdminOnlyToggle={(
                              id,
                              title,
                              isAdminOnly,
                              subfolderId
                            ) =>
                              handleAdminOnlyToggle(
                                id,
                                title,
                                isAdminOnly,
                                subfolderId
                              )
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
                              const campaign = campaigns.find(
                                (c) => c.id === id
                              );
                              setAnalyzeDialog({
                                open: true,
                                campaignId: id,
                                campaignTitle: title,
                                isReanalysis:
                                  campaign?.is_curated_for_brand || false,
                              });
                            }}
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
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      {selectedBrandId && (
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
      )}
    </div>
  );
}
