import { GalleryItem } from "@/types/gallery.types";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadIcon } from "../ui/custom-icon";
import { CheckIcon, CopyIcon, HeartIcon } from "lucide-react";
import { cn, getDimensionAndAspectRatioFromParameters } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

type ImageWithMetadataModalProps = {
  galleryItem: GalleryItem;
  parameters: Record<string, any> | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
};

const ImageWithMetadataModal = ({
  isOpen,
  onClose,
  galleryItem,
  onDownload,
  onLike,
  isLiked,
  parameters,
}: ImageWithMetadataModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    if (parameters?.prompt) {
      navigator.clipboard.writeText(parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader className="sr-only">
        <DialogTitle>Expanded Image</DialogTitle>
        <DialogDescription>
          {parameters?.prompt ??
            galleryItem.input_prompt ??
            "No description available"}
        </DialogDescription>
      </DialogHeader>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none [&>button]:hidden w-[80vw] max-h-[80vh] max-w-screen-xl flex items-center justify-center focus:outline-none"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="flex items-center justify-center  flex-1 min-w-[80vw] h-[80vh]">
          <div className="relative rounded-l-lg shadow-2xl inline-block group max-w-[70%] h-full">
            <img
              src={galleryItem.asset_url}
              alt={
                parameters?.prompt ??
                galleryItem.input_prompt ??
                "Expanded image"
              }
              className="object-contain rounded-l-lg w-full h-full"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-l-lg" />

              {/* Bottom Right - Actions (Download + Like) */}
              {(onDownload || onLike) && (
                <div className="absolute bottom-2 right-3 flex items-center space-x-2">
                  {onDownload && (
                    <TooltipButton
                      tooltip="Download"
                      icon={<DownloadIcon className="!w-5 !h-5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload();
                      }}
                      className="text-white"
                    />
                  )}

                  {onLike && (
                    <TooltipButton
                      tooltip="Like"
                      icon={
                        <HeartIcon
                          className={cn("!w-5 !h-5", {
                            "text-red-500 fill-red-500": isLiked,
                          })}
                        />
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike();
                      }}
                      isActive={isLiked}
                      normalColor="text-white hover:text-red-500"
                      activeColor="text-red-500"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          {parameters && (
            <div className="rounded-r-lg bg-background h-full flex-1 w-[30%] p-4 flex flex-col gap-y-4 overflow-y-auto">
              <div className="space-y-2">
                <p>Prompt</p>
                <div className="relative">
                  <Textarea
                    value={parameters.prompt}
                    className="h-40 lg:h-60  focus:outline-none resize-none"
                    readOnly
                  />
                  <TooltipButton
                    className="absolute top-3 right-1 text-muted-foreground"
                    tooltip={copied ? "Copied!" : "Copy Prompt"}
                    onClick={() => {
                      handleCopyPrompt();
                    }}
                    icon={
                      copied ? (
                        <CheckIcon
                          size={14}
                          className="text-muted-foreground"
                        />
                      ) : (
                        <CopyIcon size={14} className="text-muted-foreground" />
                      )
                    }
                  />
                </div>
              </div>
              <p className="text-muted-foreground">
                {parameters.model} -{" "}
                {getDimensionAndAspectRatioFromParameters(parameters)}
              </p>

              <div className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <p className="w-24">Vary</p>
                  <div className="flex flex-1 gap-x-2 items-start">
                    <Button>Auto</Button>
                    <Button>Manual</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="w-24">Upscale</p>
                  <div className="flex flex-1 gap-x-2 items-start">
                    <Button>Auto</Button>
                    <Button>Manual</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="w-24">Modify</p>
                  <div className="flex flex-1 gap-x-2 items-start">
                    <Button>Edit</Button>
                    <Button>Reference</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="w-24">Vary</p>
                  <div className="flex flex-1 gap-x-2 items-start">
                    <Button>Auto</Button>
                    <Button>Manual</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="w-24">Animate</p>
                  <div className="flex flex-1 gap-x-2 items-start">
                    <Button>Dynamic</Button>
                    <Button>Smooth</Button>
                    <Button>Manual</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageWithMetadataModal;

//  <div
//    className="relative rounded-l-lg shadow-2xl inline-block group w-[70%]"
//    onClick={onClose}
//  >

//  </div>;
