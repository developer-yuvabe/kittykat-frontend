"use client";

import { useState, type ReactNode } from "react";
import { useSubfolderMutations } from "@/hooks/useSubfolderMutations";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DialogTriggers {
  openCreate: () => void;
  openDelete: (subFolderId: string, name: string) => void;
  dialogs: ReactNode;
}

export function useCampaignFolderDialogs(
  brandId: string,
  campaignId: string,
  onSubfolderCreated?: () => void
): DialogTriggers {
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    subFolderId: "",
    name: "",
  });
  const [createDialog, setCreateDialog] = useState({
    open: false,
    name: "",
  });

  const {
    deleteSubfolder,
    createSubfolder,
    isDeletingSubfolder,
    isCreatingSubfolder,
  } = useSubfolderMutations();

  const handleDeleteConfirm = async () => {
    if (!brandId) return;
    try {
      await deleteSubfolder({
        brandId,
        campaignId,
        subFolderId: deleteDialog.subFolderId,
      });
      setDeleteDialog({ open: false, subFolderId: "", name: "" });
    } catch {
      // Keep dialog open on error
    }
  };

  const handleCreateSubmit = async () => {
    if (!brandId || !createDialog.name.trim()) return;
    try {
      await createSubfolder({
        brandId,
        campaignId,
        payload: { name: createDialog.name.trim() },
      });
      setCreateDialog({ open: false, name: "" });
      onSubfolderCreated?.();
    } catch {
      // Keep dialog open on error
    }
  };

  const dialogs = (
    <>
      {/* Create Dialog */}
      <Dialog
        open={createDialog.open}
        onOpenChange={(open) =>
          setCreateDialog((prev) => (open ? prev : { open: false, name: "" }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subfolder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={createDialog.name}
              onChange={(e) =>
                setCreateDialog((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Folder name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialog({ open: false, name: "" })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateSubmit}
              disabled={!createDialog.name.trim() || isCreatingSubfolder}
              loading={isCreatingSubfolder}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) =>
            open ? prev : { open: false, subFolderId: "", name: "" }
          )
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteDialog.name} and its items from this
              campaign. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  subFolderId: "",
                  name: "",
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletingSubfolder}
            >
              {isDeletingSubfolder ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  // Return trigger functions and render dialogs
  return {
    openCreate: () => setCreateDialog({ open: true, name: "" }),
    openDelete: (subFolderId: string, name: string) =>
      setDeleteDialog({ open: true, subFolderId, name }),
    dialogs,
  };
}
