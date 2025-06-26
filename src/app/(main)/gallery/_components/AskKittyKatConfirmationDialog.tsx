"use client";

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

interface AskKittyKatConfirmationDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onConfirm: () => void;
}

export function AskKittyKatConfirmationDialog({
  open,
  setOpen,
  onConfirm,
}: AskKittyKatConfirmationDialogProps) {
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        className="max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            Ready to Ask KittyKat?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 space-y-3">
            <p>
              Clicking Ask KittyKat will formally trigger the creative team to
              start work.
            </p>
            <p>
              Make sure your request is finalized in the comments and all
              required images are uploaded — changes after this point may not be
              possible and the request may become chargeable.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogCancel onClick={handleCancel}>
            Back to editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
