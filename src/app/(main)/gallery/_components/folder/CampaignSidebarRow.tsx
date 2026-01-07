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
} from "lucide-react";
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

interface CampaignSidebarRowProps {
  campaign: Campaign;
  selectedBrandId: string;
  selectedCampaignId: string | null;
  selectedSubFolderId: string | null;
  onCampaignSelect: (id: string, subFolderId?: string) => void;
  count?: number;
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
  isDragDisabled?: boolean;
}

export function CampaignSidebarRow({
  campaign,
  selectedBrandId,
  selectedCampaignId,
  selectedSubFolderId,
  onCampaignSelect,
  count,
  isCountLoading,
  onRename,
  onArchiveToggle,
  onCuratedToggle,
  onDelete,
  onAnalyze,
  isDragDisabled = false,
}: CampaignSidebarRowProps) {
  const { overId, activeDragData } = useGalleryDnd();
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
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

          <button
            onClick={() => onCampaignSelect(campaign.id)}
            className="flex-1 text-left px-2 py-1 rounded-md hover:bg-transparent transition-colors  max-w-56"
          >
            <div className="flex items-center gap-2.5">
              {/* Folder Icon */}
              <div className="flex items-center justify-center shrink-0">
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

          {/* Dropdown Menu */}
          <DropdownMenu>
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
                onClick={() => onRename(campaign.id, campaign.title)}
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

            return (
              <div key={subFolder.id} className="relative">
                <div
                  className={cn(
                    "relative group rounded-lg transition-all duration-200",
                    isSubFolderActive
                      ? "bg-gradient-to-r from-purple-50 to-purple-50/50 shadow-sm"
                      : "bg-transparent hover:bg-gray-50/80"
                  )}
                >
                  <div className="flex items-center gap-1 py-1.5 pl-1">
                    {/* Tree connector visualization */}
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <div className="relative w-full h-full">
                        <div className="absolute left-2.5 top-0 w-px h-1/2 bg-gray-300" />
                        <div className="absolute left-2.5 top-1/2 w-2 h-px bg-gray-300" />
                        {!isLast && (
                          <div className="absolute left-2.5 top-1/2 w-px h-1/2 bg-gray-300" />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubFolderSelect(subFolder.id)}
                      className="flex-1 text-left px-2 py-1.5 rounded-md hover:bg-transparent transition-colors max-w-56"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Subfolder Icon */}
                        <div className="flex items-center justify-center shrink-0">
                          <Folder
                            className={cn(
                              "w-[16px] h-[16px]",
                              isSubFolderActive
                                ? "text-purple-600"
                                : "text-gray-400"
                            )}
                          />
                        </div>

                        {/* Subfolder Name */}
                        <div className="flex-1 min-w-0">
                          <CampaignSidebarTruncatedText
                            text={subFolder.name}
                            className={cn(
                              "text-xs leading-tight truncate",
                              isSubFolderActive
                                ? "text-purple-900 font-semibold"
                                : "text-gray-700 font-medium"
                            )}
                          />
                        </div>

                        {/* Count Badge - aligned with parent */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={cn(
                              "text-[11px] font-medium min-w-[20px] text-center rounded-full px-1.5 py-0.5",
                              isSubFolderActive
                                ? "text-purple-700 bg-purple-100/80"
                                : "text-gray-500 bg-gray-100/80"
                            )}
                          >
                            0
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* SubFolder Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-md mr-1",
                            "opacity-0 group-hover:opacity-100 hover:bg-gray-200/60",
                            "transition-all duration-150 flex-shrink-0"
                          )}
                          title="More options"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => {}}>
                          <Pencil className="w-4 h-4 mr-2 text-gray-600" />
                          Rename
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {}}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
