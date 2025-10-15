// components/video-metadata/VideoWithMetadataModal.tsx
import { GalleryItemResponse } from "@/types/gallery.types";
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
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { useRouter } from "next/navigation";
import { useModelsStore } from "@/store/models.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { videoGenerationService } from "@/services/api/video-gen.service";
import { getGalleryImageParameters } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { A2iImageGeneration } from "@/types/types";

type VideoWithMetadataModalProps = {
  galleryItem: GalleryItemResponse;
  generation?: {
    type: A2iImageGeneration["type"];
    parameters: A2iImageGeneration["parameters"];
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  source: "concept-visual-media" | "media-gallery";
};

const VideoWithMetadataModal = ({
  isOpen,
  onClose,
  galleryItem,
  onDownload,
  onLike,
  isLiked,
  generation,
  source,
}: VideoWithMetadataModalProps) => {
  const router = useRouter();
  const { setParameters } = useMetadataActionsStore();
  const [loading, setLoading] = useState({
    varyAuto: false,
  });
  const [copied, setCopied] = useState(false);
  const { selectedBrandId } = useBrandStore();
  const { setSelectedVideoGenearationModel, models } = useModelsStore();
  const { openConceptVisual } = useConceptVisualStore();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const { data, isFetching: isFetchingParams } = useQuery({
    queryKey: ["video-parameters", galleryItem.brand_id, galleryItem.id],
    queryFn: () =>
      getGalleryImageParameters(galleryItem.brand_id, galleryItem.id),
    enabled: !!galleryItem.id,
    placeholderData: generation
      ? {
          type: generation.type,
          parameters: generation.parameters,
        }
      : null,
    staleTime: 0,
  });

  const isDisabled = !(
    data?.type === "video_generation" || data?.type === "video"
  );

  const handleCopyPrompt = () => {
    if (data?.parameters?.prompt) {
      navigator.clipboard.writeText(data.parameters.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVaryAuto = async () => {
    if (!data?.parameters) return;
    setLoading((p) => ({ ...p, varyAuto: true }));

    try {
      const model = models.find((m) => m.model === data.parameters.model);
      if (!model) throw new Error("Model not found for variation");

      await videoGenerationService(selectedBrandId!, {
        ...data.parameters,
        source_asset_id: galleryItem.id,
      });

      onClose();
      if (source === "media-gallery") router.push("/?scrollTo=a2i");
      toast.info("Started Generation of Auto Vary Video.");
    } catch {
      toast.error("Error generating varied video. Please try again.");
    } finally {
      setLoading((p) => ({ ...p, varyAuto: false }));
    }
  };

  const handleVaryManual = async () => {
    if (!data?.parameters) return;

    try {
      const model = models.find((m) => m.model === data.parameters.model);

      if (!model) {
        throw new Error("No model found for this video.");
      }

      // ✅ Find parameter definitions from model
      const durationParam = model.parameters?.find((p) => p.id === "duration");
      const fpsParam = model.parameters?.find((p) => p.id === "framepersecond");

      const convertValue = (
        value: string | number,
        paramDef: any
      ): string | number => {
        if (!paramDef) return value;

        const valueType = typeof value;
        const targetType = typeof paramDef.defaultValue;

        // If types already match, return as-is
        if (valueType === targetType) {
          return value;
        }

        // Convert if types don't match
        if (targetType === "number" && valueType === "string") {
          return parseInt(value as string, 10);
        }
        if (targetType === "string" && valueType === "number") {
          return value.toString();
        }
        return value;
      };

      const videoParams = {
        ...data.parameters,
        ...(data.parameters.duration && {
          duration: convertValue(data.parameters.duration, durationParam),
        }),
        ...(data.parameters.framepersecond && {
          framepersecond: convertValue(
            data.parameters.framepersecond,
            fpsParam
          ),
        }),
      };

      // ✅ Set model + parameters
      setSelectedVideoGenearationModel(model);
      setParameters("videoParameters", videoParams);

      openConceptVisual({
        source: "blanket",
        assetItems: [galleryItem],
        asset: null,
        defaultActiveTab: "video-generation",
      });

      onClose();

      toast.info(
        "Preselected Model and its paramters set in Video Generation tab."
      );
    } catch (error) {
      console.error(error);
      toast.error(
        "An error occurred while loading the video generation editor. Please try again."
      );
    }
  };

  const handleUpscaleAuto = () => toast.info("Video upscaling coming soon.");
  const handleUpscaleManual = () => toast.info("Manual upscaling coming soon.");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader className="sr-only">
        <DialogTitle>Expanded Video</DialogTitle>
        <DialogDescription>
          {data?.parameters?.prompt ??
            galleryItem.input_prompt ??
            "No description available"}
        </DialogDescription>
      </DialogHeader>

      <DialogContent
        className="p-0 border-none bg-transparent shadow-none flex items-center justify-center focus:outline-none"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
        hideCloseIcon
        overflowClassName="bg-black/80"
      >
        <div className="flex justify-center items-stretch flex-1 min-w-[80dvw] min-h-[80dvh] max-w-[80dvw] max-h-[80dvh]">
          {/* 🎥 Left Side — Video Preview */}
          <div className="relative rounded-l-lg flex items-center justify-center w-[70%] overflow-hidden bg-white border-r group">
            <video
              ref={videoRef}
              src={galleryItem.asset_url}
              controls
              autoPlay
              loop
              muted={false}
              className="relative z-10 w-full h-full object-contain"
            />

            <div
              className="absolute inset-0 bg-cover bg-center blur-lg scale-105 z-0 pointer-events-none"
              style={{
                backgroundImage: `url(${galleryItem.asset_url})`,
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-l-lg pointer-events-none z-[5]" />

            {/* ✅ Hover buttons — visible only on hover */}
            <div className="absolute top-3 right-3 flex items-center space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
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
                  tooltip={isLiked ? "Unlike" : "Like"}
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
          </div>

          {/* 📄 Right Side — Metadata & Actions */}
          <div className="rounded-r-lg bg-background h-auto w-[30%] p-4 flex flex-col gap-y-4 overflow-y-auto">
            {isFetchingParams ? (
              <div className="flex items-center justify-center flex-col gap-2 h-full">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            ) : (
              <>
                {data?.parameters && (
                  <>
                    {/* Prompt */}
                    {data.parameters.prompt && (
                      <div className="space-y-2">
                        <p>Prompt</p>
                        <div className="relative">
                          <Textarea
                            value={data.parameters.prompt}
                            className="h-40 lg:h-60 focus:outline-none resize-none"
                            readOnly
                          />
                          <TooltipButton
                            className="absolute top-3 right-1 text-muted-foreground"
                            tooltip={copied ? "Copied!" : "Copy Prompt"}
                            onClick={handleCopyPrompt}
                            icon={
                              copied ? (
                                <CheckIcon
                                  size={14}
                                  className="text-muted-foreground"
                                />
                              ) : (
                                <CopyIcon
                                  size={14}
                                  className="text-muted-foreground"
                                />
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Model Info */}
                    <div className="flex flex-wrap gap-x-3 text-muted-foreground">
                      <span>{data.parameters.model}</span>
                      <span>{data.parameters.resolution}</span>
                      <span>{data.parameters.aspect_ratio}</span>
                      <span>{data.parameters.duration}s</span>
                    </div>
                  </>
                )}

                {/* ⚙️ Creative Actions */}
                <div className="space-y-4 mt-4">
                  <h2 className="text-lg border-b pb-2">Creative Actions</h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="w-24">Vary</p>
                      <div className="flex flex-1 gap-x-2 items-start">
                        <Button
                          onClick={!isDisabled ? handleVaryAuto : undefined}
                          disabled={isDisabled || loading.varyAuto}
                          loading={loading.varyAuto}
                        >
                          Auto
                        </Button>
                        <Button
                          onClick={!isDisabled ? handleVaryManual : undefined}
                          disabled={isDisabled}
                        >
                          Manual
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="w-24">Upscale</p>
                      <div className="flex flex-1 gap-2 items-start flex-wrap">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger
                              asChild
                              className="disabled:pointer-events-auto"
                            >
                              <Button disabled onClick={handleUpscaleAuto}>
                                Auto
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Video upscaling coming soon.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger
                              asChild
                              className="disabled:pointer-events-auto"
                            >
                              <Button disabled onClick={handleUpscaleManual}>
                                Manual
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Video upscaling coming soon.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoWithMetadataModal;
