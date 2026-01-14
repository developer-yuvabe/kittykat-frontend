import React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface CampaignArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  isArchived: boolean;
  isProcessing: boolean;
  onConfirm: () => void;
}

export function CampaignArchiveDialog({
  open,
  onOpenChange,
  campaignTitle,
  isArchived,
  isProcessing,
  onConfirm,
}: CampaignArchiveDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isArchived ? "Unarchive Campaign" : "Archive Campaign"}
      description={
        <>
          Are you sure you want to {isArchived ? "unarchive" : "move"}{" "}
          <span className="font-semibold text-gray-900">
            &quot;{campaignTitle}&quot;
          </span>{" "}
          {isArchived ? "back to active campaigns?" : "to the archive?"}
        </>
      }
      confirmLabel={isArchived ? "Unarchive" : "Archive"}
      onConfirm={onConfirm}
      isLoading={isProcessing}
    />
  );
}
