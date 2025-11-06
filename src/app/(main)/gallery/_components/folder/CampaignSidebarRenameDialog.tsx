"use client";

import React, { useState, useEffect } from "react";
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
import { updateCampaignName } from "@/services/api/brand.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandStore } from "@/store/brand.store";

interface CampaignSidebarRenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  campaignId: string;
  campaignTitle: string;
}

export function CampaignSidebarRenameDialog({
  open,
  onOpenChange,
  brandId,
  campaignId,
  campaignTitle,
}: CampaignSidebarRenameDialogProps) {
  const [newName, setNewName] = useState(campaignTitle);
  const queryClient = useQueryClient();
  const { brands, setBrands } = useBrandStore();

  // Update newName when campaignTitle changes (prefill with old name)
  useEffect(() => {
    if (open && campaignTitle) {
      setNewName(campaignTitle);
    }
  }, [open, campaignTitle]);

  const handleSave = async () => {
    if (!newName.trim()) return;

    const trimmedName = newName.trim();
    onOpenChange(false);

    // Store previous state for rollback
    const previousBrands = brands;

    try {
      // Optimistically update the brands state
      const updatedBrands = brands.map((brand) => {
        if (brand.id === brandId) {
          return {
            ...brand,
            campaigns: brand.campaigns.map((campaign) =>
              campaign.id === campaignId
                ? { ...campaign, title: trimmedName }
                : campaign
            ),
          };
        }
        return brand;
      });

      // Update the store immediately for optimistic UI
      setBrands(updatedBrands);

      // Then make the API call
      await updateCampaignName(brandId, campaignId, trimmedName);

      // Invalidate brands query to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["brands"] });

      toast.success("Campaign renamed successfully");
    } catch (error) {
      // Rollback to previous state on error
      setBrands(previousBrands);
      toast.error("Failed to rename campaign");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter campaign name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!newName.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
