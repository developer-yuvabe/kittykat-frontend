"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Folder,
  MoreVertical,
  Pencil,
  Trash,
  Loader2,
  Star,
  EyeOff,
  Eye,
  Check,
  X,
  Copy,
} from "lucide-react";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleProtectedComponent } from "@/components/shared/RoleProtectedComponent";
import { CampaignSidebarTruncatedText } from "./CampaignSidebarTruncatedText";
import { useDroppable } from "@dnd-kit/core";
import { useSubfolderDroppable } from "@/lib/gallery-dnd.utils";
import { useGalleryDnd } from "@/contexts/GalleryDndContext";
import { DragItemEnum } from "@/types/gallery-dnd.types";

interface SubfolderRowProps {
  subFolder: {
    id: string;
    name: string;
    is_admin_only?: boolean;
    is_kk_folder?: boolean;
    is_kk_selected?: boolean;
  };
  campaignId: string;
  isLast: boolean;
  isActive: boolean;
  count?: number;
  isCountLoading: boolean;
  onSelect: (subFolderId: string) => void;
  onRename: (subFolderId: string, name: string) => void;
  onDelete: (subFolderId: string, name: string) => void;
  onDuplicate?: (subFolderId: string, name: string) => void;
  onKKFolderToggle: (
    subFolderId: string,
    name: string,
    isKKFolder: boolean
  ) => void;
  onKKSelectedToggle: (
    subFolderId: string,
    name: string,
    isKKSelected: boolean
  ) => void;
  onAdminOnlyToggle: (
    subFolderId: string,
    name: string,
    isAdminOnly: boolean
  ) => void;
}

export function SubfolderRow({
  subFolder,
  campaignId,
  isLast,
  isActive,
  count,
  isCountLoading,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  onKKFolderToggle,
  onKKSelectedToggle,
  onAdminOnlyToggle,
}: SubfolderRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(subFolder.name);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useUserStore();
  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  // DnD setup
  const { activeDragData } = useGalleryDnd();
  const droppableConfig = {
    ...useSubfolderDroppable(subFolder.id),
    data: {
      ...useSubfolderDroppable(subFolder.id).data,
      campaignId, // Add campaign_id to droppable data
    },
  };
  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  const isMediaDrag =
    activeDragData?.type === DragItemEnum.MediaItem ||
    activeDragData?.type === DragItemEnum.MediaItemsMulti;

  const isDropTarget = isOver && isMediaDrag;

  const handleRenameStart = () => {
    setIsRenaming(true);
    setRenameValue(subFolder.name);
  };

  const handleRenameConfirm = () => {
    if (renameValue.trim() && renameValue !== subFolder.name) {
      onRename(subFolder.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(subFolder.name);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropdownOpen(true);
  };

  return (
    <div className="relative" ref={setNodeRef}>
      <div
        className={cn(
          "relative group rounded-lg transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-purple-50 to-purple-50/50 shadow-sm"
            : "bg-transparent hover:bg-gray-50/80",
          isDropTarget && "ring-2 ring-purple-400 bg-purple-50/30"
        )}
        onContextMenu={handleContextMenu}
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

          {/* Subfolder Icon */}
          <div className="flex items-center justify-center shrink-0 ml-2 relative">
            <Folder
              className={cn(
                "w-[22px] h-[22px]",
                isActive ? "text-purple-600" : "text-gray-400"
              )}
            />
            {/* KK Badge inside folder */}
            <RoleProtectedComponent>
              {subFolder.is_kk_folder && (
                <span className="absolute top-1 text-[10px] font-bold text-purple-600 px-[2px] py-[2px] rounded">
                  KK
                </span>
              )}
            </RoleProtectedComponent>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <RoleProtectedComponent>
              {subFolder.is_kk_selected && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              )}
            </RoleProtectedComponent>
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
              onClick={() => onSelect(subFolder.id)}
              className={cn(
                "flex-1 text-left px-2 py-1.5 rounded-md hover:bg-transparent transition-colors max-w-56",
                subFolder.is_admin_only && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2.5">
                {/* Subfolder Name */}
                <div className="flex-1 min-w-0">
                  <CampaignSidebarTruncatedText
                    text={subFolder.name}
                    className={cn(
                      "text-xs leading-tight truncate",
                      isActive
                        ? "text-purple-900 font-semibold"
                        : "text-gray-700 font-medium"
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
          )}

          {/* SubFolder Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameStart();
                }}
              >
                <Pencil className="w-4 h-4 mr-2 text-gray-600" />
                Rename
              </DropdownMenuItem>

              <RoleProtectedComponent>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onKKFolderToggle(
                      subFolder.id,
                      subFolder.name,
                      subFolder.is_kk_folder || false
                    );
                  }}
                >
                  <Folder className="w-4 h-4 mr-2 text-gray-600" />
                  {subFolder.is_kk_folder
                    ? "Remove as KK Folder"
                    : "Mark as KK Folder"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onKKSelectedToggle(
                      subFolder.id,
                      subFolder.name,
                      subFolder.is_kk_selected || false
                    );
                  }}
                >
                  <Star className="w-4 h-4 mr-2 text-gray-600" />
                  {subFolder.is_kk_selected
                    ? "Remove as KK Selects"
                    : "Mark as KK Selects"}
                </DropdownMenuItem>
              </RoleProtectedComponent>

              {isAdmin && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdminOnlyToggle(
                      subFolder.id,
                      subFolder.name,
                      subFolder.is_admin_only || false
                    );
                  }}
                >
                  {subFolder.is_admin_only ? (
                    <Eye className="w-4 h-4 mr-2 text-gray-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 mr-2 text-gray-600" />
                  )}
                  {subFolder.is_admin_only
                    ? "Show to Clients"
                    : "Hide from Clients"}
                </DropdownMenuItem>
              )}

              {onDuplicate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(subFolder.id, subFolder.name);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2 text-gray-600" />
                  Duplicate
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(subFolder.id, subFolder.name);
                }}
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
}
