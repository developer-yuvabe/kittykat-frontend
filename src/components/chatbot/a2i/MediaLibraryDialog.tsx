// MediaLibraryDialog.tsx
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MediaLibrary } from "@/app/(main)/gallery/_components/MediaLibrary";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
}: MediaLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90%] min-w-6xl overflow-y-scroll p-0">
        <div className="px-4">
          <MediaLibrary activeTab="all-media" isMediaSelectDialog={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
