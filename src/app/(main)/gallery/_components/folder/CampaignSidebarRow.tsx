"use client";

import React from "react";
import {
  Folder,
  MoreVertical,
  Pencil,
  Archive,
  Trash,
  Brain,
  ChartNetwork,
} from "lucide-react";
import { Loader2 } from "lucide-react";
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
  onCampaignSelect: (id: string) => void;
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
  // DnD props
  isDragDisabled?: boolean;
}

export function CampaignSidebarRow({
  campaign,
  selectedBrandId,
  selectedCampaignId,
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
  // Get overId from context to detect when media is being dragged over this campaign
  const { overId, activeDragData } = useGalleryDnd();

  // Use sortable for campaign reordering
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

  // Use droppable for receiving media items
  const { setNodeRef: setDroppableRef, isOver: isDroppableOver } =
    useDroppable(droppableConfig);

  // Check if this campaign is the drop target
  const isDropTarget = isCampaignDropTarget(
    campaign.id,
    overId,
    activeDragData,
    isDroppableOver
  );

  // Style for drag transform
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={combineRefs(setSortableRef, setDroppableRef)}
      style={style}
      key={`${selectedBrandId}-${campaign.id}`}
      className={cn(
        "relative group rounded-lg transition-all duration-150",
        isDragging && "ring-2 ring-purple-500 shadow-lg",
        isDropTarget && "ring-2 ring-purple-500 bg-purple-50 shadow-md"
      )}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={() => onCampaignSelect(campaign.id)}
        className={cn(
          "w-full text-left px-3 py-2.5 pr-10 rounded-lg transition-colors hover:bg-gray-50",
          selectedCampaignId === campaign.id
            ? "bg-purple-50 hover:bg-purple-100"
            : "bg-white"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              selectedCampaignId === campaign.id
                ? "bg-purple-100"
                : "bg-gray-100 group-hover:bg-gray-200"
            )}
          >
            <Folder
              className={cn(
                "w-4 h-4",
                selectedCampaignId === campaign.id
                  ? "text-purple-600"
                  : "text-gray-600"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <CampaignSidebarTruncatedText
              text={campaign.title}
              className={cn(
                "text-sm font-medium truncate",
                selectedCampaignId === campaign.id
                  ? "text-purple-900"
                  : "text-gray-900"
              )}
            />
          </div>

          {/* Count badge */}
          <div className="flex items-center gap-2 mr-6">
            {isCountLoading ? (
              <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
            ) : (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  selectedCampaignId === campaign.id
                    ? " text-purple-700"
                    : " text-gray-600"
                )}
              >
                {count ?? 0}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Three-dot dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200"
            title="More options"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => onRename(campaign.id, campaign.title)}
          >
            <Pencil className="w-4 h-4 mr-2 text-gray-600" /> Rename
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
            <Trash className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
