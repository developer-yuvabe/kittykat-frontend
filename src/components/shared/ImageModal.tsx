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
        className="p-0 border-none bg-transparent shadow-none [&>button]:hidden !max-h-[90vh] !max-w-[90vw] h-[90vh] w-max flex items-center justify-center"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="relative aspect-square rounded-lg shadow-2xl h-full w-max group">
          <img src={imageUrl} alt={alt} className="object-contain rounded-lg" />

          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-6 right-6 bg-white/95 hover:bg-white border-2 rounded-full w-10 h-10 shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Close expanded image"
            >
              <span className="text-lg font-semibold">✕</span>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
