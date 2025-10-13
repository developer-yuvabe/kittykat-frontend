"use client";

import React, { useState, useMemo } from "react";
import { Search, Folder, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBrandStore } from "@/store/brand.store";
import { CreateCampaignDialog } from "@/components/gallery/CreateCampaignDialog";
import { cn } from "@/lib/utils";
import { updateCampaignName } from "@/services/api/brand.service";
import { toast } from "sonner";

interface CampaignsSidebarProps {
  selectedBrandId: string | null;
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string) => void;
}

export function CampaignsSidebar({
  selectedBrandId,
  selectedCampaignId,
  onCampaignSelect,
}: CampaignsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingCampaign, setRenamingCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const { brands } = useBrandStore();

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

  const handleRenameClick = (
    e: React.MouseEvent,
    campaign: { id: string; title: string }
  ) => {
    e.stopPropagation();
    setRenamingCampaign(campaign);
    setNewCampaignName(campaign.title);
    setRenameDialogOpen(true);
  };

  const handleRenameSave = async () => {
    if (!renamingCampaign || !selectedBrandId || !newCampaignName.trim()) {
      return;
    }

    setIsRenaming(true);
    try {
      await updateCampaignName(
        selectedBrandId,
        renamingCampaign.id,
        newCampaignName.trim()
      );
      toast.success("Campaign renamed successfully");
      setRenameDialogOpen(false);
      setRenamingCampaign(null);
      setNewCampaignName("");
      // Refetch brands to update the UI
    } catch (error) {
      console.error("Error renaming campaign:", error);
      toast.error("Failed to rename campaign");
    } finally {
      setIsRenaming(false);
    }
  };

  if (!selectedBrandId) {
    return null;
  }

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-[99%] w-80 rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
          Campaigns
        </h3>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Campaign Count & Create Button */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {filteredCampaigns.length} campaign
          {filteredCampaigns.length !== 1 ? "s" : ""}
        </span>
        <CreateCampaignDialog
          brandId={selectedBrandId}
          brandName={brandName}
          onCampaignCreated={onCampaignSelect}
        />
      </div>

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCampaigns.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="relative group">
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
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
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
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          selectedCampaignId === campaign.id
                            ? "text-purple-900"
                            : "text-gray-900"
                        )}
                      >
                        {campaign.title}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Rename button - shows on hover */}
                <button
                  onClick={(e) => handleRenameClick(e, campaign)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100",
                    "hover:bg-gray-200 focus:opacity-100 focus:bg-gray-200"
                  )}
                  title="Rename campaign"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Folder className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-2">
              {searchQuery
                ? "No campaigns found"
                : "No campaigns in this brand"}
            </p>
            {!searchQuery && (
              <CreateCampaignDialog
                brandId={selectedBrandId}
                brandName={brandName}
                onCampaignCreated={onCampaignSelect}
                trigger={
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Campaign
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Campaign</DialogTitle>
            <DialogDescription>
              Change the name of your campaign. This will update how it appears
              throughout the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRenaming) {
                    handleRenameSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRenameSave}
              disabled={isRenaming || !newCampaignName.trim()}
            >
              {isRenaming ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
