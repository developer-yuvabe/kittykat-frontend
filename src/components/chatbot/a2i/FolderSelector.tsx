"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Folder, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { RoleProtectedComponent } from "@/components/shared/RoleProtectedComponent";

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  isKKFolder: boolean;
  isKKSelected: boolean;
  isHidden: boolean;
  subFolders: { id: string; name: string }[];
}

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export default function FolderSelector({
  selectedFolderId,
  onFolderSelect,
}: FolderSelectorProps) {
  const [open, setOpen] = useState(false);
  const { getSelectedBrandCampaigns } = useBrandStore();
  const [searchQuery, setSearchQuery] = useState("");

  const campaigns = getSelectedBrandCampaigns();

  // Transform campaigns into folder structure
  const folders = useMemo<FolderItem[]>(() => {
    const folderList: FolderItem[] = [];

    campaigns.forEach((campaign) => {
      // Add campaign as a folder

      folderList.push({
        id: campaign.id,
        name: campaign.title || "Untitled Campaign",
        parentId: null,
        isKKFolder: campaign.is_kk_folder || false,
        isKKSelected: campaign.is_kk_selected || false,
        isHidden: campaign.is_admin_only || false,
        subFolders: campaign.sub_folders || [],
      });

      // Add subfolders if they exist
      if (campaign.sub_folders && campaign.sub_folders.length > 0) {
        campaign.sub_folders.forEach((subFolder) => {
          folderList.push({
            id: subFolder.id,
            name: subFolder.name,
            parentId: campaign.id,
            isKKFolder: subFolder.is_kk_folder || false,
            isKKSelected: subFolder.is_kk_selected || false,
            isHidden: false,
            subFolders: [],
          });
        });
      }
    });

    return folderList;
  }, [campaigns]);

  // Filter folders based on search query and permissions
  const filteredFolders = useMemo(() => {
    // Filter hidden folders and apply search
    const filtered = folders.filter((folder) => {
      // Skip hidden folders
      if (folder.isHidden) return false;

      // Apply search filter
      if (searchQuery.trim()) {
        return folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });

    return filtered;
  }, [folders, searchQuery]);

  // Group folders by parent (campaign)
  const groupedFolders = useMemo(() => {
    const groups = new Map<string, FolderItem[]>();

    filteredFolders.forEach((folder) => {
      if (folder.parentId === null) {
        // This is a campaign folder
        if (!groups.has(folder.id)) {
          groups.set(folder.id, []);
        }
      } else {
        // This is a subfolder
        if (!groups.has(folder.parentId)) {
          groups.set(folder.parentId, []);
        }
        groups.get(folder.parentId)!.push(folder);
      }
    });

    return groups;
  }, [filteredFolders]);

  // Get selected folder name
  const selectedFolderName = useMemo(() => {
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder?.name || "Select Folder";
  }, [selectedFolderId, folders]);

  const handleSelect = (folderId: string) => {
    onFolderSelect(folderId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal text-gray-700 border-gray-300 hover:border-purple-400 transition-colors mt-0.5"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Folder className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span className="truncate text-sm">{selectedFolderName}</span>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-transform",
              open && "rotate-90"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search folders..."
              className="h-9 w-full border-0 outline-none focus-visible:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No folders found.</CommandEmpty>

            {/* Render campaign folders with their subfolders */}
            {Array.from(groupedFolders.entries()).map(
              ([campaignId, subFolders]) => {
                const campaign = filteredFolders.find(
                  (f) => f.id === campaignId && f.parentId === null
                );

                if (!campaign) return null;

                return (
                  <div key={campaignId}>
                    {/* Campaign Folder */}
                    <CommandItem
                      value={`${campaign.name}::${campaign.id}`}
                      onSelect={() => handleSelect(campaign.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer",
                        selectedFolderId === campaign.id &&
                          "bg-purple-50 text-purple-700"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Folder
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedFolderId === campaign.id
                              ? "text-purple-600"
                              : "text-gray-500"
                          )}
                        />
                        <span className="truncate font-medium text-sm">
                          {campaign.name}
                        </span>
                        <RoleProtectedComponent>
                          {campaign.isKKSelected && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                          {campaign.isKKFolder && (
                            <Folder className="w-3 h-3 text-blue-500" />
                          )}
                        </RoleProtectedComponent>
                      </div>
                      {selectedFolderId === campaign.id && (
                        <Check className="h-4 w-4 flex-shrink-0 text-purple-600" />
                      )}
                    </CommandItem>

                    {/* Subfolders */}
                    {subFolders.length > 0 && (
                      <CommandGroup className="pl-6 border-l-2 border-gray-100 ml-3">
                        {subFolders.map((subFolder) => (
                          <CommandItem
                            key={subFolder.id}
                            value={`${subFolder.name}::${subFolder.id}`}
                            onSelect={() => handleSelect(subFolder.id)}
                            className={cn(
                              "flex items-center justify-between px-3 py-1.5 cursor-pointer",
                              selectedFolderId === subFolder.id &&
                                "bg-purple-50 text-purple-700"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Folder
                                className={cn(
                                  "h-3.5 w-3.5 flex-shrink-0",
                                  selectedFolderId === subFolder.id
                                    ? "text-purple-600"
                                    : "text-gray-400"
                                )}
                              />
                              <span className="truncate text-sm">
                                {subFolder.name}
                              </span>
                              <RoleProtectedComponent>
                                {subFolder.isKKSelected && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                                {subFolder.isKKFolder && (
                                  <Folder className="w-3 h-3 text-blue-500" />
                                )}
                              </RoleProtectedComponent>
                            </div>
                            {selectedFolderId === subFolder.id && (
                              <Check className="h-4 w-4 flex-shrink-0 text-purple-600" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </div>
                );
              }
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
