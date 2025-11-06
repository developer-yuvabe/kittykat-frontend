"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Folder,
  Pencil,
  MoreVertical,
  Archive,
  Trash,
} from "lucide-react";
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
import {
  deleteCampaign,
  updateCampaign,
  updateCampaignName,
} from "@/services/api/brand.service";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { useCampaignCounts } from "@/hooks/useCampaignCounts";
import { Loader2 } from "lucide-react";
import { useUndoableAction } from "@/hooks/useUndoableAction";

// Component to show tooltip only when text is truncated
function TruncatedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [text]);

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <p ref={textRef} className={className}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          <p className="max-w-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <p ref={textRef} className={className}>
      {text}
    </p>
  );
}

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
  const { brands } = useBrandStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [targetCampaign, setTargetCampaign] = useState<{
    id: string;
    title: string;
    is_archived?: boolean;
  } | null>(null);

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

  // console.log("filteredCampaigns:", filteredCampaigns);

  const { execute } = useUndoableAction();

  const handleDeleteConfirm = async () => {
    if (!targetCampaign || !selectedBrandId) return;
    const title = targetCampaign.title;

    await execute({
      title,
      undoSeconds: 3,
      loadingMessage: `Deleting "${title}"...`,
      action: () => deleteCampaign(selectedBrandId, targetCampaign.id),
      successMessage: `"${title}" deleted successfully.`,
      errorMessage: `Failed to delete "${title}".`,
    });

    setDeleteDialogOpen(false);
    setTargetCampaign(null);
  };

  const handleArchiveConfirm = async () => {
    if (!targetCampaign || !selectedBrandId) return;

    const title = targetCampaign.title;
    const isArchived = targetCampaign.is_archived;

    await execute({
      title,
      undoSeconds: 4,
      loadingMessage: `${
        isArchived ? "Unarchiving" : "Archiving"
      } "${title}"...`,
      action: () =>
        updateCampaign(selectedBrandId, targetCampaign.id, {
          is_archived: !isArchived,
        }),
      successMessage: `"${title}" ${
        isArchived ? "unarchived" : "archived"
      } successfully.`,
      errorMessage: `Failed to ${
        isArchived ? "unarchive" : "archive"
      } "${title}".`,
    });

    setArchiveDialogOpen(false);
    setTargetCampaign(null);
  };

  const handleRenameSave = async () => {
    if (!renamingCampaign || !selectedBrandId || !newCampaignName.trim())
      return;

    const campaignId = renamingCampaign.id;
    const oldName = renamingCampaign.title;
    const newName = newCampaignName.trim();

    setRenameDialogOpen(false);
    setRenamingCampaign(null);
    setNewCampaignName("");

    await execute({
      title: oldName,
      undoSeconds: 3, // Allow 5s to undo rename
      loadingMessage: `Renaming "${oldName}" to "${newName}"...`,
      action: () => updateCampaignName(selectedBrandId, campaignId, newName),
      successMessage: `Renamed "${oldName}" to "${newName}".`,
      errorMessage: `Failed to rename "${oldName}".`,
    });
  };

  const activeCampaigns = filteredCampaigns.filter((c) => !c.is_archived);
  const archivedCampaigns = filteredCampaigns.filter((c) => c.is_archived);
  const { setSelectedCampaignId } = useBrandStore();
  const { orderBy, setOrderBy } = useGalleryFilterStore();

  if (!selectedBrandId) {
    return null;
  }

  return (
    <div className="border-r border-gray-200 bg-white flex flex-col h-[99%] w-1/3 rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {selectedCampaignId ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCampaignSelect("");
              setSelectedCampaignId(null);
              if (orderBy === "brand_sort_order") {
                setOrderBy("created_at_descending");
              }
            }}
            className="text-sm font-semibold text-gray-900 hover:text-purple-600"
          >
            ← Go Back
          </Button>
        ) : (
          <h3 className="text-2xl font-semibold text-gray-900 truncate flex-1">
            Campaigns
          </h3>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 flex justify-center items-center gap-2 ">
        <div className="relative w-2/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="w-1/3 flex justify-center">
          <CreateCampaignDialog
            brandId={selectedBrandId}
            brandName={brandName}
            onCampaignCreated={onCampaignSelect}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["active"]}>
          {/* Active Campaigns */}
          <AccordionItem value="active">
            <AccordionTrigger className="text-lg p-4 hover:no-underline font-medium text-gray-800">
              Active Campaigns ({activeCampaigns.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
                {activeCampaigns.map((campaign) => (
                  <CampaignRow
                    key={`${selectedBrandId}-${campaign.id}`}
                    campaign={campaign}
                    selectedBrandId={selectedBrandId}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignSelect={onCampaignSelect}
                    count={countData?.count_by_campaign?.[campaign.id]}
                    isCountLoading={isCountLoading}
                    onRename={(campaign) => {
                      setRenamingCampaign(campaign);
                      setNewCampaignName(campaign.title);
                      setRenameDialogOpen(true);
                    }}
                    onArchiveToggle={(campaign) => {
                      setTargetCampaign(campaign);
                      setArchiveDialogOpen(true);
                    }}
                    onDelete={(campaign) => {
                      setTargetCampaign(campaign);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
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
            <AccordionTrigger className="text-lg p-4 hover:no-underline font-medium text-gray-800">
              Archived Campaigns ({archivedCampaigns.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 p-2">
                {archivedCampaigns.map((campaign) => (
                  <CampaignRow
                    key={`${selectedBrandId}-${campaign.id}`}
                    campaign={campaign}
                    selectedBrandId={selectedBrandId}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignSelect={onCampaignSelect}
                    count={countData?.count_by_campaign?.[campaign.id]}
                    isCountLoading={isCountLoading}
                    onRename={(campaign) => {
                      setRenamingCampaign(campaign);
                      setNewCampaignName(campaign.title);
                      setRenameDialogOpen(true);
                    }}
                    onArchiveToggle={(campaign) => {
                      setTargetCampaign(campaign);
                      setArchiveDialogOpen(true);
                    }}
                    onDelete={(campaign) => {
                      setTargetCampaign(campaign);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
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
                  if (e.key === "Enter") {
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
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRenameSave}
              disabled={!newCampaignName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {targetCampaign?.is_archived
                ? "Unarchive Campaign"
                : "Archive Campaign"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {targetCampaign?.is_archived ? "unarchive" : "move"}{" "}
              <span className="font-semibold text-gray-900">
                “{targetCampaign?.title}”
              </span>{" "}
              {targetCampaign?.is_archived
                ? "back to active campaigns?"
                : "to the archive?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleArchiveConfirm}>
              {targetCampaign?.is_archived ? "Unarchive" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-900">
                “{targetCampaign?.title}”
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignRow({
  campaign,
  selectedBrandId,
  selectedCampaignId,
  onCampaignSelect,
  count,
  isCountLoading,
  onRename,
  onArchiveToggle,
  onDelete,
}: {
  campaign: any;
  selectedBrandId: string;
  selectedCampaignId: string | null;
  onCampaignSelect: (id: string) => void;
  count?: number;
  isCountLoading: boolean;
  onRename: (campaign: any) => void;
  onArchiveToggle: (campaign: any) => void;
  onDelete: (campaign: any) => void;
}) {
  return (
    <div key={`${selectedBrandId}-${campaign.id}`} className="relative group">
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
            <TruncatedText
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
          <DropdownMenuItem onClick={() => onRename(campaign)}>
            <Pencil className="w-4 h-4 mr-2 text-gray-600" /> Rename
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onArchiveToggle(campaign)}>
            <Archive className="w-4 h-4 mr-2 text-gray-600" />
            {campaign.is_archived ? "Unarchive" : "Move to Archive"}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onDelete(campaign)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
