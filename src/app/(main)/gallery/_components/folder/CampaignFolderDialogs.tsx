"use client";

import { useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const createSubfolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(50, "Folder name is too long"),
});

type CreateSubfolderForm = z.infer<typeof createSubfolderSchema>;

interface DialogTriggers {
  openCreate: () => void;
  openDelete: (subFolderId: string, name: string) => void;
  dialogs: ReactNode;
}

/* ------------------ hook ------------------ */

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

  const [createOpen, setCreateOpen] = useState(false);

  const {
    deleteSubfolder,
    createSubfolder,
    isDeletingSubfolder,
    isCreatingSubfolder,
  } = useSubfolderMutations();

  /* ------------------ form ------------------ */

  const form = useForm<CreateSubfolderForm>({
    resolver: zodResolver(createSubfolderSchema),
    defaultValues: {
      name: "",
    },
  });

  /* ------------------ handlers ------------------ */

  const handleCreateSubmit = async (values: CreateSubfolderForm) => {
    if (!brandId) return;

    try {
      await createSubfolder({
        brandId,
        campaignId,
        payload: { name: values.name.trim() },
      });

      form.reset();
      setCreateOpen(false);
      onSubfolderCreated?.();
    } catch {
      // keep dialog open on error
    }
  };

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
      // keep dialog open on error
    }
  };

  /* ------------------ dialogs ------------------ */

  const dialogs = (
    <>
      {/* ---------- Create Dialog ---------- */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subfolder</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Folder name" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  loading={isCreatingSubfolder}
                  disabled={isCreatingSubfolder}
                >
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ---------- Delete Dialog ---------- */}
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
              This will remove <strong>{deleteDialog.name}</strong> and its
              items from this campaign. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

  return {
    openCreate: () => setCreateOpen(true),
    openDelete: (subFolderId: string, name: string) =>
      setDeleteDialog({ open: true, subFolderId, name }),
    dialogs,
  };
}
