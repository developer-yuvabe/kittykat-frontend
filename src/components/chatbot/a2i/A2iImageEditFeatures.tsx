"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { A2iImageDetail } from "@/types/types";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { X } from "lucide-react";

const A2iImageEditFeatures = ({
  image,
  onClose,
}: {
  image: A2iImageDetail;
  onClose: () => void;
}) => {
  const [open, setOpen] = React.useState(!!image);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);

        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="p-4 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col justify-between"
        hideCloseIcon
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-between">
            <DialogTitle>Edit Image</DialogTitle>
            <div className="flex gap-2 items-center">
              <TooltipIconButton
                tooltip="Close"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X />
              </TooltipIconButton>
            </div>
          </div>
        </DialogHeader>

        {image && (
          <>
            <div className="flex justify-center items-center overflow-auto h-full mx-auto scrollbar">
              <div className="relative">
                <img
                  src={image.url || ""}
                  crossOrigin="anonymous"
                  alt="Editable"
                  className="block  max-h-[75vh] object-contain border w-max"
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default A2iImageEditFeatures;
