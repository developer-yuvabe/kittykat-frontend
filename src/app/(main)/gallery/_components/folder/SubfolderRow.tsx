"use client";

import { cn } from "@/lib/utils";
import {
  Folder,
  MoreVertical,
  Pencil,
  Trash,
  Loader2,
  Star,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignSidebarTruncatedText } from "./CampaignSidebarTruncatedText";

interface SubfolderRowProps {
  subFolder: {
    id: string;
    name: string;
    is_admin_only?: boolean;
    is_kk_folder?: boolean;
    is_kk_selected?: boolean;
  };
  isLast: boolean;
  isActive: boolean;
  count?: number;
  isCountLoading: boolean;
  onSelect: (subFolderId: string) => void;
  onRename: (subFolderId: string, name: string) => void;
  onDelete: (subFolderId: string, name: string) => void;
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
  isLast,
  isActive,
  count,
  isCountLoading,
  onSelect,
  onRename,
  onDelete,
  onKKFolderToggle,
  onKKSelectedToggle,
  onAdminOnlyToggle,
}: SubfolderRowProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "relative group rounded-lg transition-all duration-200",
          isActive
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
            onClick={() => onSelect(subFolder.id)}
            className="flex-1 text-left px-2 py-1.5 rounded-md hover:bg-transparent transition-colors max-w-56"
          >
            <div className="flex items-center gap-2.5">
              {/* Subfolder Icon */}
              <div className="flex items-center justify-center shrink-0">
                <Folder
                  className={cn(
                    "w-[16px] h-[16px]",
                    isActive ? "text-purple-600" : "text-gray-400"
                  )}
                />
              </div>

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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(subFolder.id, subFolder.name);
                }}
              >
                <Pencil className="w-4 h-4 mr-2 text-gray-600" />
                Rename
              </DropdownMenuItem>

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
