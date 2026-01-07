import React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface CampaignDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function CampaignDeleteDialog({
  open,
  onOpenChange,
  campaignTitle,
  isDeleting,
  onConfirm,
}: CampaignDeleteDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Campaign"
      description={
        <>
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-gray-900">
            &quot;{campaignTitle}&quot;
          </span>
          ? This action cannot be undone.
        </>
      }
      confirmLabel="Delete"
      onConfirm={onConfirm}
      isLoading={isDeleting}
      danger
    />
  );
}
