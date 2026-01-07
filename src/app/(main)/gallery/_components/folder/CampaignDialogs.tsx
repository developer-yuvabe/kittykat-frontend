import React from "react";
import { CampaignSidebarRenameDialog } from "./CampaignSidebarRenameDialog";
import { CampaignArchiveDialog } from "./CampaignArchiveDialog";
import { CampaignDeleteDialog } from "./CampaignDeleteDialog";
import { CampaignAnalyzeDialog } from "./CampaignAnalyzeDialog";
import { CampaignCuratedDialog } from "./CampaignCuratedDialog";

interface CampaignDialogsProps {
  selectedBrandId: string;
  renameDialog: {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
  };
  setRenameDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      campaignId: string;
      campaignTitle: string;
    }>
  >;
  archiveDialog: {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isArchived: boolean;
    isProcessing: boolean;
  };
  setArchiveDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      campaignId: string;
      campaignTitle: string;
      isArchived: boolean;
      isProcessing: boolean;
    }>
  >;
  deleteDialog: {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isDeleting: boolean;
  };
  setDeleteDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      campaignId: string;
      campaignTitle: string;
      isDeleting: boolean;
    }>
  >;
  analyzeDialog: {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isReanalysis: boolean;
  };
  setAnalyzeDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      campaignId: string;
      campaignTitle: string;
      isReanalysis: boolean;
    }>
  >;
  curatedDialog: {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    isCurated: boolean;
    isProcessing: boolean;
  };
  setCuratedDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      campaignId: string;
      campaignTitle: string;
      isCurated: boolean;
      isProcessing: boolean;
    }>
  >;
  isAnalyzing: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
  onCuratedToggle: () => void;
}

export function CampaignDialogs({
  selectedBrandId,
  renameDialog,
  setRenameDialog,
  archiveDialog,
  setArchiveDialog,
  deleteDialog,
  setDeleteDialog,
  analyzeDialog,
  setAnalyzeDialog,
  curatedDialog,
  setCuratedDialog,
  isAnalyzing,
  onArchive,
  onDelete,
  onAnalyze,
  onCuratedToggle,
}: CampaignDialogsProps) {
  return (
    <>
      <CampaignSidebarRenameDialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog({ open, campaignId: "", campaignTitle: "" })
        }
        brandId={selectedBrandId}
        campaignId={renameDialog.campaignId}
        campaignTitle={renameDialog.campaignTitle}
      />

      <CampaignArchiveDialog
        open={archiveDialog.open}
        onOpenChange={(open) =>
          setArchiveDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isArchived: false,
            isProcessing: false,
          })
        }
        campaignTitle={archiveDialog.campaignTitle}
        isArchived={archiveDialog.isArchived}
        isProcessing={archiveDialog.isProcessing}
        onConfirm={onArchive}
      />

      <CampaignDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isDeleting: false,
          })
        }
        campaignTitle={deleteDialog.campaignTitle}
        isDeleting={deleteDialog.isDeleting}
        onConfirm={onDelete}
      />

      <CampaignAnalyzeDialog
        open={analyzeDialog.open}
        onOpenChange={(open) =>
          setAnalyzeDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isReanalysis: false,
          })
        }
        campaignTitle={analyzeDialog.campaignTitle}
        isReanalysis={analyzeDialog.isReanalysis}
        isAnalyzing={isAnalyzing}
        onConfirm={onAnalyze}
      />

      <CampaignCuratedDialog
        open={curatedDialog.open}
        onOpenChange={(open) =>
          setCuratedDialog({
            open,
            campaignId: "",
            campaignTitle: "",
            isCurated: false,
            isProcessing: false,
          })
        }
        campaignTitle={curatedDialog.campaignTitle}
        isCurated={curatedDialog.isCurated}
        isProcessing={curatedDialog.isProcessing}
        onConfirm={onCuratedToggle}
      />
    </>
  );
}
