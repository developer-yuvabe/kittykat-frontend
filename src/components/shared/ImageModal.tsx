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
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

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
        <div
          className="relative rounded-lg shadow-2xl inline-block group"
          onClick={onClose}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="object-contain rounded-lg max-h-[90vh] max-w-[90vw] w-auto h-auto"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            {(onDownload || onLike) && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />
            )}

            {/* Bottom Left - Download Button with Tooltip */}
            {onDownload && (
              <div className="absolute bottom-2 left-3">
                <TooltipIconButton
                  tooltip="Download"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="text-white hover:text-black"
                >
                  <DownloadIcon className="!w-5 !h-5" />
                </TooltipIconButton>
              </div>
            )}

            {/* Bottom Right - Like Button with Tooltip */}
            {onLike && (
              <div className="absolute bottom-2 right-3">
                <TooltipIconButton
                  tooltip="Like"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  className="text-white hover:text-red-500"
                >
                  <HeartIcon
                    className={cn("!w-5 !h-5", {
                      "text-red-500 fill-red-500": isLiked,
                    })}
                  />
                </TooltipIconButton>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
