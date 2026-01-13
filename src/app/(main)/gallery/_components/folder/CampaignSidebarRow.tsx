"use client";

import React, { useState } from "react";
import {
  Folder,
  MoreVertical,
  Pencil,
  Archive,
  Trash,
  Brain,
  ChartNetwork,
  Loader2,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Plus,
  Star,
  EyeOff,
  Eye,
  Check,
  X,
  Copy,
} from "lucide-react";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignSidebarTruncatedText } from "./CampaignSidebarTruncatedText";
import { Campaign } from "@/types/user.types";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useGalleryDnd } from "@/contexts/GalleryDndContext";
import {
  useCampaignDroppable,
  createCampaignSortableData,
  isCampaignDropTarget,
  combineRefs,
} from "@/lib/gallery-dnd.utils";
import { useCampaignFolderDialogs } from "./CampaignFolderDialogs";
import { SubfolderRow } from "./SubfolderRow";
import { useSubfolderMutations } from "@/hooks/useSubfolderMutations";

interface CampaignSidebarRowProps {
  campaign: Campaign;
  selectedBrandId: string;
  selectedCampaignId: string | null;
  selectedSubFolderId: string | null;
  onCampaignSelect: (id: string, subFolderId?: string) => void;
  count?: number;
  subfolderCounts?: Record<string, number>;
  isCountLoading: boolean;
  onRename: (campaignId: string, title: string) => void;
  onArchiveToggle: (
    campaignId: string,
    title: string,
    isArchived: boolean
  ) => void;
  onCuratedToggle: (
    campaignId: string,
    title: string,
    isCurated: boolean
  ) => void;
  onDelete: (campaignId: string, title: string) => void;
  onAnalyze: (campaignId: string, title: string) => void;
  onDuplicate: (campaignId: string, title: string) => void;
  onKKFolderToggle: (
    campaignId: string,
    title: string,
    isKKFolder: boolean,
    subfolderId?: string
  ) => void;
  onKKSelectedToggle: (
    campaignId: string,
    title: string,
    isKKSelected: boolean,
    subfolderId?: string
  ) => void;
  onAdminOnlyToggle: (
    campaignId: string,
    title: string,
    isAdminOnly: boolean,
    subfolderId?: string
  ) => void;
  onSubfolderDuplicate?: (
    campaignId: string,
    subFolderId: string,
    title: string
  ) => void;
  isDragDisabled?: boolean;
}

export function CampaignSidebarRow({
  campaign,
  selectedBrandId,
  selectedCampaignId,
  selectedSubFolderId,
  onCampaignSelect,
  count,
  subfolderCounts,
  isCountLoading,
  onRename,
  onArchiveToggle,
  onCuratedToggle,
  onDelete,
  onAnalyze,
  onDuplicate,
  onKKFolderToggle,
  onKKSelectedToggle,
  onAdminOnlyToggle,
  onSubfolderDuplicate,
  isDragDisabled = false,
}: CampaignSidebarRowProps) {
  const { overId, activeDragData } = useGalleryDnd();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(campaign.title);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { openCreate, openDelete, dialogs } = useCampaignFolderDialogs(
    selectedBrandId,
    campaign.id,
    () => setIsExpanded(true)
  );

  const { updateSubfolder } = useSubfolderMutations();
  const { user } = useUserStore();
  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: campaign.id,
    disabled: isDragDisabled,
    data: createCampaignSortableData(
      campaign.id,
      campaign.is_archived || false
    ),
  });

  const droppableConfig = useCampaignDroppable(campaign.id);
  const { setNodeRef: setDroppableRef, isOver: isDroppableOver } =
    useDroppable(droppableConfig);

  const isDropTarget = isCampaignDropTarget(
    campaign.id,
    overId,
    activeDragData,
    isDroppableOver
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const isActive = selectedCampaignId === campaign.id && !selectedSubFolderId;
  const hasSubFolders = campaign.sub_folders && campaign.sub_folders.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSubFolderSelect = (subFolderId: string) => {
    onCampaignSelect(campaign.id, subFolderId);
  };

  const handleRenameStart = () => {
    setIsRenaming(true);
    setRenameValue(campaign.title);
  };

  const handleRenameConfirm = () => {
    if (renameValue.trim() && renameValue !== campaign.title) {
      onRename(campaign.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(campaign.title);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  const handleSubfolderRename = async (subFolderId: string, name: string) => {
    if (!selectedBrandId) return;
    await updateSubfolder({
      brandId: selectedBrandId,
      campaignId: campaign.id,
      subFolderId,
      payload: { name },
    });
  };

  const handleSubfolderKKFolderToggle = async (
    subFolderId: string,
    name: string,
    isKKFolder: boolean
  ) => {
    if (!selectedBrandId) return;
    await updateSubfolder({
      brandId: selectedBrandId,
      campaignId: campaign.id,
      subFolderId,
      payload: { is_kk_folder: !isKKFolder },
      title: name,
      undoSeconds: 3,
    });
  };

  const handleSubfolderKKSelectedToggle = async (
    subFolderId: string,
    name: string,
    isKKSelected: boolean
  ) => {
    if (!selectedBrandId) return;
    await updateSubfolder({
      brandId: selectedBrandId,
      campaignId: campaign.id,
      subFolderId,
      payload: { is_kk_selected: !isKKSelected },
      title: name,
      undoSeconds: 3,
    });
  };

  const handleSubfolderAdminOnlyToggle = async (
    subFolderId: string,
    name: string,
    isAdminOnly: boolean
  ) => {
    if (!selectedBrandId) return;
    await updateSubfolder({
      brandId: selectedBrandId,
      campaignId: campaign.id,
      subFolderId,
      payload: { is_admin_only: !isAdminOnly },
      title: name,
      undoSeconds: 3,
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropdownOpen(true);
  };

  return (
    <>
      <div className="space-y-0">
        {/* Main Campaign Row */}
        <div
          ref={combineRefs(setSortableRef, setDroppableRef)}
          style={style}
          key={`${selectedBrandId}-${campaign.id}`}
          className={cn(
            "relative group rounded-lg transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-purple-50 to-purple-50/50 shadow-sm"
              : "bg-transparent hover:bg-gray-50/80",
            isDragging && "ring-2 ring-purple-400 shadow-xl bg-white",
            isDropTarget && "ring-2 ring-purple-400 bg-purple-50/80 shadow-lg"
          )}
          {...attributes}
          {...listeners}
          onContextMenu={handleContextMenu}
        >
          {/* Row content */}
          <div className="flex items-center gap-1 py-1.5 pl-1">
            {/* Expand/Collapse Chevron */}
            {hasSubFolders ? (
              <button
                onClick={handleToggleExpand}
                className="flex items-center justify-center w-5 h-5 hover:bg-gray-200/60 rounded transition-colors flex-shrink-0 max-w-40"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            {/* Folder Icon */}
            <div className="flex items-center justify-center shrink-0 ml-2">
              {isExpanded && hasSubFolders ? (
                <FolderOpen
                  className={cn(
                    "w-[18px] h-[18px]",
                    isActive ? "text-purple-600" : "text-gray-500"
                  )}
                />
              ) : (
                <Folder
                  className={cn(
                    "w-[18px] h-[18px]",
                    isActive ? "text-purple-600" : "text-gray-500"
                  )}
                />
              )}
            </div>

            {isRenaming ? (
              <div className="flex-1 flex items-center gap-1 px-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  className="flex-1 text-xs px-1.5 py-0.5 rounded border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameConfirm();
                  }}
                  className="flex items-center justify-center w-5 h-5 hover:bg-green-100 rounded transition-colors"
                  title="Confirm"
                >
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameCancel();
                  }}
                  className="flex items-center justify-center w-5 h-5 hover:bg-red-100 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onCampaignSelect(campaign.id)}
                className={cn(
                  "flex-1 text-left px-2 py-1 rounded-md hover:bg-transparent transition-colors max-w-56",
                  campaign.is_admin_only && "opacity-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {/* Campaign Title */}
                  <div className="flex-1 min-w-0">
                    <CampaignSidebarTruncatedText
                      text={campaign.title}
                      className={cn(
                        "text-xs leading-tight truncate",
                        isActive
                          ? "text-purple-900 font-semibold"
                          : "text-gray-800 font-medium"
                      )}
                    />
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {campaign.is_kk_selected && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                    {campaign.is_kk_folder && (
                      <Folder className="w-3 h-3 text-blue-500" />
                    )}
                    {campaign.is_curated_for_brand && (
                      <Brain className="w-3 h-3 text-purple-500" />
                    )}
                  </div>

                  {/* Count Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCountLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                    ) : (
                      <span
                        className={cn(
                          "text-[9px] font-medium min-w-[20px] text-center rounded-full px-1.5 py-0.5",
                          isActive
                            ? "text-purple-700 bg-purple-100/80"
                            : "text-gray-500 bg-gray-100/80"
                        )}
                      >
                        {count ?? 0}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* Dropdown Menu */}
            <DropdownMenu
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md mr-1",
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-150 flex-shrink-0"
                  )}
                  title="More options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreate();
                  }}
                >
                  <Plus className="w-4 h-4 mr-2 text-gray-600" />
                  New subfolder
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameStart();
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2 text-gray-600" />
                  Rename
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    onArchiveToggle(
                      campaign.id,
                      campaign.title,
                      campaign.is_archived || false
                    )
                  }
                >
                  <Archive className="w-4 h-4 mr-2 text-gray-600" />
                  {campaign.is_archived ? "Unarchive" : "Move to Archive"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    onKKFolderToggle(
                      campaign.id,
                      campaign.title,
                      campaign.is_kk_folder || false
                    )
                  }
                >
                  <Folder className="w-4 h-4 mr-2 text-gray-600" />
                  {campaign.is_kk_folder
                    ? "Remove as KK Folder"
                    : "Mark as KK Folder"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() =>
                    onKKSelectedToggle(
                      campaign.id,
                      campaign.title,
                      campaign.is_kk_selected || false
                    )
                  }
                >
                  <Star className="w-4 h-4 mr-2 text-gray-600" />
                  {campaign.is_kk_selected
                    ? "Remove as KK Selects"
                    : "Mark as KK Selects"}
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() =>
                      onAdminOnlyToggle(
                        campaign.id,
                        campaign.title,
                        campaign.is_admin_only || false
                      )
                    }
                  >
                    {campaign.is_admin_only ? (
                      <Eye className="w-4 h-4 mr-2 text-gray-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 mr-2 text-gray-600" />
                    )}
                    {campaign.is_admin_only
                      ? "Show to Clients"
                      : "Hide from Clients"}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() =>
                    onCuratedToggle(
                      campaign.id,
                      campaign.title,
                      campaign.is_curated_for_brand || false
                    )
                  }
                  disabled={campaign.is_analyzing}
                >
                  <Brain className="w-4 h-4 mr-2 text-gray-600" />
                  {campaign.is_curated_for_brand
                    ? "Unmark as Curated Campaign"
                    : "Mark as Curated Campaign"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onAnalyze(campaign.id, campaign.title)}
                  disabled={campaign.is_analyzing}
                >
                  <ChartNetwork className="w-4 h-4 mr-2 text-gray-600" />
                  {campaign.is_analyzing
                    ? "Analyzing..."
                    : campaign.is_curated_for_brand
                    ? "Reanalyze"
                    : "Analyze"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onDuplicate(campaign.id, campaign.title)}
                >
                  <Copy className="w-4 h-4 mr-2 text-gray-600" />
                  Duplicate
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onDelete(campaign.id, campaign.title)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* SubFolders with Tree Lines */}
        {hasSubFolders && isExpanded && (
          <div className="relative mt-1 space-y-0">
            {campaign.sub_folders!.map((subFolder, index) => {
              const isSubFolderActive =
                selectedCampaignId === campaign.id &&
                selectedSubFolderId === subFolder.id;
              const isLast = index === campaign.sub_folders!.length - 1;
              const subFolderCount = subfolderCounts?.[subFolder.id] ?? 0;

              return (
                <SubfolderRow
                  key={subFolder.id}
                  subFolder={subFolder}
                  campaignId={campaign.id}
                  onRename={handleSubfolderRename}
                  isLast={isLast}
                  isActive={isSubFolderActive}
                  count={subFolderCount}
                  isCountLoading={isCountLoading}
                  onSelect={handleSubFolderSelect}
                  onDelete={openDelete}
                  onDuplicate={
                    onSubfolderDuplicate
                      ? (subFolderId, name) =>
                          onSubfolderDuplicate(campaign.id, subFolderId, name)
                      : undefined
                  }
                  onKKFolderToggle={handleSubfolderKKFolderToggle}
                  onKKSelectedToggle={handleSubfolderKKSelectedToggle}
                  onAdminOnlyToggle={handleSubfolderAdminOnlyToggle}
                />
              );
            })}
          </div>
        )}
      </div>

      {dialogs}
    </>
  );
}
