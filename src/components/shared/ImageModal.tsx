import {
  Dialog,
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
        className="p-0 border-none bg-transparent shadow-none [&>button]:hidden w-[80vw] max-h-[80vh] max-w-screen-xl flex items-center justify-center cursor-zoom-out"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="relative rounded-lg shadow-2xl inline-block group">
          <img
            src={imageUrl}
            alt={alt}
            className="object-contain rounded-lg max-h-[90vh] max-w-[90vw] w-auto h-auto "
            onClick={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
