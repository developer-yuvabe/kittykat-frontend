import React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface CampaignCuratedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  isCurated: boolean;
  isProcessing: boolean;
  onConfirm: () => void;
}

export function CampaignCuratedDialog({
  open,
  onOpenChange,
  campaignTitle,
  isCurated,
  isProcessing,
  onConfirm,
}: CampaignCuratedDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isCurated ? "Unmark Curated Campaign" : "Mark as Curated Campaign"
      }
      description={
        <>
          Are you sure you want to {isCurated ? "unmark" : "mark"}{" "}
          <span className="font-semibold text-gray-900">
            &quot;{campaignTitle}&quot;
          </span>{" "}
          {isCurated
            ? "as a regular campaign?"
            : "as a curated campaign for brand analysis?"}
        </>
      }
      confirmLabel={isCurated ? "Unmark" : "Mark as Curated"}
      onConfirm={onConfirm}
      isLoading={isProcessing}
    />
  );
}
