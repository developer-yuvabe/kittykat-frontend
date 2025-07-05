import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import { DownloadIcon } from "../ui/custom-icon";
import { HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
  isOpen: boolean;
  onDownload?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  onClose,
  alt = "Expanded image",
  isOpen,
  onDownload,
  onLike,
  isLiked,
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
          {/* Bottom left - Download */}

          {onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="absolute bottom-2 left-2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          )}

          {/* Bottom right - Like */}
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-red-500 p-2 rounded-full shadow"
            >
              <HeartIcon
                className={cn("w-5 h-5", {
                  "fill-red-500": isLiked,
                })}
              />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
