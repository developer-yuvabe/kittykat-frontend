import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
  isOpen: boolean;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  onClose,
  alt = "Expanded image",
  isOpen,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader className="sr-only">
        <DialogTitle>Expanded Image</DialogTitle>
        <DialogDescription>{alt}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none [&>button]:hidden !max-h-[90vh] !max-w-[90vw] flex items-center justify-center"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="relative rounded-lg shadow-2xl max-h-full max-w-full group">
          <img
            src={imageUrl}
            alt={alt}
            className="object-contain rounded-lg max-h-[90vh] max-w-[90vw] w-auto h-auto"
          />
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/95 hover:bg-white border-2 rounded-full w-8 h-8 shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Close expanded image"
            >
              <span className="text-base font-semibold">✕</span>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
