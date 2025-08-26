"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCampaignMutations } from "@/hooks/useCampaignMutations";

interface CreateCampaignDialogProps {
  brandId: string;
  brandName: string;
  onCampaignCreated?: (campaignId: string) => void;
  onRefreshData?: () => void;
  trigger?: React.ReactNode;
}

export function CreateCampaignDialog({
  brandId,
  brandName,
  onCampaignCreated,
  onRefreshData,
  trigger,
}: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { createCampaign, isCreatingCampaign } = useCampaignMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      const newCampaign = await createCampaign({
        brandId,
        title: title.trim(),
      });

      // Trigger parent data refresh to ensure the new campaign is available
      if (onRefreshData) {
        onRefreshData();
      }

      // Reset form and close dialog
      setTitle("");
      setOpen(false);

      // Only navigate to the campaign after backend confirms creation with real ID
      // Add a delay to ensure data refresh is complete
      if (onCampaignCreated && newCampaign?.id) {
        setTimeout(() => {
          onCampaignCreated(newCampaign.id);
        }, 800); // Increased delay to ensure data refresh is complete
      }
    } catch (error) {
      // Error is handled in the mutation hook
      console.error("Failed to create campaign:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTitle(""); // Reset form when closing
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign for <strong>{brandName}</strong>.
              <br />
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter campaign title..."
                className="col-span-3"
                maxLength={100}
                required
                autoFocus
                disabled={isCreatingCampaign}
              />
            </div>
            {title.trim().length > 50 && (
              <div className="text-xs text-gray-500 text-right">
                {title.trim().length}/100 characters
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreatingCampaign}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isCreatingCampaign}
              loading={isCreatingCampaign}
            >
              {isCreatingCampaign ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
