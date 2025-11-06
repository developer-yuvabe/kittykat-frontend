"use client";

import React from "react";
import { Folder, MoreVertical, Pencil, Archive, Trash } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignSidebarTruncatedText } from "./CampaignSidebarTruncatedText";

interface Campaign {
  id: string;
  title: string;
  is_archived?: boolean;
}

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
  onDelete: (campaignId: string, title: string) => void;
  onAssetDragOver?: (e: React.DragEvent, campaignId: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onAssetDrop?: (e: React.DragEvent, campaignId: string) => void;
  isDraggedOver?: boolean;
  onCampaignDragStart?: (
    e: React.DragEvent,
    campaignId: string,
    isArchived: boolean
  ) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  onSectionDragOver?: (
    e: React.DragEvent,
    section: "active" | "archived"
  ) => void;
  onSectionDrop?: (e: React.DragEvent, section: "active" | "archived") => void;
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
  onDelete,
  onAssetDragOver,
  onDragLeave,
  onAssetDrop,
  isDraggedOver,
  onCampaignDragStart,
  onDragEnd,
  isDragging,
  onSectionDragOver,
  onSectionDrop,
}: CampaignSidebarRowProps) {
  const handleDragOver = (e: React.DragEvent) => {
    // Check if dragging a campaign (for archive/unarchive)
    const hasCampaignData = e.dataTransfer.types.includes(
      "application/campaign-drag"
    );

    if (hasCampaignData && onSectionDragOver) {
      // Pass to section handler for archive/unarchive
      const section = campaign.is_archived ? "archived" : "active";
      onSectionDragOver(e, section);
    } else if (onAssetDragOver) {
      // Handle asset drag (moving assets to campaign)
      onAssetDragOver(e, campaign.id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Check if dragging a campaign (for archive/unarchive)
    const hasCampaignData = e.dataTransfer.types.includes(
      "application/campaign-drag"
    );

    if (hasCampaignData && onSectionDrop) {
      // Pass to section handler for archive/unarchive
      const section = campaign.is_archived ? "archived" : "active";
      onSectionDrop(e, section);
    } else if (onAssetDrop) {
      // Handle asset drop (moving assets to campaign)
      onAssetDrop(e, campaign.id);
    }
  };

  return (
    <div
      key={`${selectedBrandId}-${campaign.id}`}
      className={cn("relative group", isDragging && "opacity-40")}
      draggable={true}
      onDragStart={
        onCampaignDragStart
          ? (e) =>
              onCampaignDragStart(e, campaign.id, campaign.is_archived || false)
          : undefined
      }
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={() => onCampaignSelect(campaign.id)}
        className={cn(
          "w-full text-left px-3 py-2.5 pr-10 rounded-lg transition-colors hover:bg-gray-50",
          selectedCampaignId === campaign.id
            ? "bg-purple-50 hover:bg-purple-100"
            : "bg-white",
          isDraggedOver && "ring-2 ring-purple-500 bg-purple-50"
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
