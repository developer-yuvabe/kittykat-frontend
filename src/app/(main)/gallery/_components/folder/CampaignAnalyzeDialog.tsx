import React from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";

interface CampaignAnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignTitle: string;
  isReanalysis: boolean;
  isAnalyzing: boolean;
  onConfirm: () => void;
}

export function CampaignAnalyzeDialog({
  open,
  onOpenChange,
  campaignTitle,
  isReanalysis,
  isAnalyzing,
  onConfirm,
}: CampaignAnalyzeDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isReanalysis ? "Reanalyze Campaign" : "Analyze Campaign"}
      description={
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            {isReanalysis ? (
              <>
                Reanalyze visual style patterns for{" "}
                <span className="font-semibold text-gray-900">
                  &quot;{campaignTitle}&quot;
                </span>
                ?
              </>
            ) : (
              <>
                Trigger Brand Brain analysis for{" "}
                <span className="font-semibold text-gray-900">
                  &quot;{campaignTitle}&quot;
                </span>
                ?
              </>
            )}
          </p>
          <p className="text-sm text-gray-600">
            {isReanalysis
              ? "This will refresh the visual style analysis from all curated gallery images in this campaign."
              : "This will analyze visual style patterns from the curated gallery images and mark this campaign for Brand Brain analysis."}
          </p>
          {!isReanalysis && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800">
                <span className="font-semibold">Note:</span> Scheduled analysis
                will run daily for any newly added images.
              </p>
            </div>
          )}
        </div>
      }
      confirmLabel={isReanalysis ? "Reanalyze" : "Analyze"}
      onConfirm={onConfirm}
      isLoading={isAnalyzing}
    />
  );
}
