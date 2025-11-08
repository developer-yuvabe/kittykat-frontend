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
import { useQueryClient } from "@tanstack/react-query";
import { useUndoableAction } from "@/hooks/useUndoableAction";

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
  const { execute } = useUndoableAction();

  // Update newName when campaignTitle changes (prefill with old name)
  useEffect(() => {
    if (open && campaignTitle) {
      setNewName(campaignTitle);
    }
  }, [open, campaignTitle]);

  const handleSave = async () => {
    if (!newName.trim()) return;

    const trimmedName = newName.trim();
    const oldName = campaignTitle;

    onOpenChange(false);

    try {
      await execute({
        title: oldName,
        undoSeconds: 3,
        loadingMessage: `Renaming "${oldName}" to "${trimmedName}"...`,
        action: async () => {
          await updateCampaignName(brandId, campaignId, trimmedName);
          // Invalidate brands query to ensure sync with server
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: `Renamed "${oldName}" to "${trimmedName}".`,
        errorMessage: `Failed to rename "${oldName}".`,
      });
    } catch (error) {
      // Error already handled by useUndoableAction
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
