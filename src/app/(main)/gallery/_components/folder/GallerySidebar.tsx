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
import { useCampaignCounts } from "@/hooks/useCampaignCounts";
import { useCampaignAnalyzingStatus } from "@/hooks/sse/useCampaignAnalyzingStatus";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import BrandSelector from "@/components/chatbot/brands/BrandSelector";
import { CampaignSidebarHeader } from "./CampaignSidebarHeader";
import { CampaignSidebarRow } from "./CampaignSidebarRow";
import { CampaignDialogs } from "./CampaignDialogs";
import { DroppableSectionHeader } from "./CampaignDroppableSectionHeader";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useQueryClient } from "@tanstack/react-query";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import {
  deleteCampaign,
  updateCampaign,
  setCampaignCuration,
} from "@/services/api/brand.service";
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
}: GallerySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { brands, archiveCampaign, setSelectedCampaignId } = useBrandStore();
  const { selectedSubFolderId, setSelectedSubFolderId } =
    useGalleryFilterStore();
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();

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

  // Update gallery when campaign is archived/unarchived
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

  // Collapsed state
  if (isCollapsed) {
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
              <p>Open Media Library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-full min-h-0 min-w-[240px] max-w-[380px] w-[18vw] lg:w-[16vw] xl:w-[18vw] rounded-sm">
      {/* Header */}
      <div className="flex flex-col px-4 gap-y-3 mt-2">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Media library</h1>
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
                <p>Close Media Library</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Brand Selector */}
        {!hasNoBrands && (
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
              setSelectedCampaignId(null);
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 min-h-0 mt-4">
        <div className="px-4 space-y-6">
          {/* System Folders Section */}
          <div>
            <div className="space-y-0.5">
              {/* Seperte All media button */}
              <button
                key="all-media"
                onClick={() => {
                  onTabChange("all-media");
                  onCampaignSelect("");
                  setSelectedCampaignId(null);
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
                      setSelectedCampaignId(null);
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
              <div className="flex flex-row justify-between">
                <h3 className="text-xs font-bold text-gray-500 mb-2">
                  Campaign Folders
                </h3>
                <CreateCampaignDialog
                  brandId={selectedBrandId!}
                  brandName={brandName}
                  onCampaignCreated={onCampaignSelect}
                />
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
                              setSelectedCampaignId(campaignId);
                              setSelectedSubFolderId(subFolderId || null);
                              setSelectedFilters((prev) => ({
                                ...prev,
                                campaigns: [campaignId],
                                sub_folders: subFolderId ? [subFolderId] : [],
                              }));
                              onTabChange("all-media");
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
                              setSelectedCampaignId(campaignId);
                              setSelectedSubFolderId(subFolderId || null);
                              setSelectedFilters((prev) => ({
                                ...prev,
                                campaigns: [campaignId],
                                sub_folders: subFolderId ? [subFolderId] : [],
                              }));
                              onTabChange("all-media");
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
