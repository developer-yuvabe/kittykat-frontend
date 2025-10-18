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
import { CheckIcon, CopyIcon, HeartIcon, Loader2 } from "lucide-react";
import { cn, getDimensionAndAspectRatioFromParameters } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { generateImage } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { useRouter } from "next/navigation";
import { useModelsStore } from "@/store/models.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { upscaleImage } from "@/services/api/upscale.service";
import {
  generateAnimationPrompt,
  videoGenerationService,
} from "@/services/api/video-gen.service";
import { useDynamicModelSchema } from "@/hooks/useDynamicModelSchema";
import { GetGalleryImageParameters } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import ZoomableImage from "../ui/zoomable-image";

type ImageWithMetadataModalProps = {
  galleryItem: GalleryItemResponse;
  parameters?: Record<string, any> | null;
  type?: string;
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
  parameters: propParameters,
  type: propType,
}: ImageWithMetadataModalProps) => {
  const { setParameters } = useMetadataActionsStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { selectedBrandId } = useBrandStore();
  const { openConceptVisual } = useConceptVisualStore();
  const {
    setSelectedImageGenerationModelById,
    setSelectedVideoGenearationModelById,
    setSelectedRemixModelById,
    models,
  } = useModelsStore();
  const router = useRouter();
  // ✅ Fetch parameters only if not provided
  const { data, isLoading: isFetchingParams } = useQuery({
    queryKey: ["image-parameters", galleryItem.brand_id, galleryItem.id],
    queryFn: () =>
      GetGalleryImageParameters(galleryItem.brand_id, galleryItem.id),
    enabled: !propParameters && galleryItem.asset_source == "showboard-media",
  });

  // Final parameters (prop takes precedence, else fetched)
  const parameters = propParameters ?? data?.parameters ?? null;
  const type = propType ?? data?.type ?? null;
  const isDisabledType =
    type === "vton" || type === "remix" || type === "upscale" || type === null;

  const referenceImages =
    parameters?.reference_images ||
    (Array.isArray(parameters?.image) && parameters.image) ||
    [];

  const MODELS_WITHOUT_REFERENCE_IMAGE = [
    "imagen-4.0-ultra-generate-001",
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
    "seedream-3-0-t2i-250415",
  ];

  const handleCopyPrompt = () => {
    if (parameters?.prompt) {
      navigator.clipboard.writeText(parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleVaryAuto = async () => {
    if (!parameters) return;

    setLoading("vary-auto");
    try {
      // campaignId is already included in parameters

      await generateImage(selectedBrandId!, {
        ...parameters,
        seed: -1,
      });

      onClose();
      if (!propParameters) {
        router.push("/?scrollTo=a2i-input");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Error generating a varied image. Please try again.");
    } finally {
      setLoading(null);
      toast.info("Started Generation of Auto Vary Image.");
    }
  };

  const handleVaryManual = () => {
    if (!parameters) return;

    if (parameters.model) {
      setSelectedImageGenerationModelById(parameters.model);
      setParameters("imageGeneationParameters", null);
      setParameters("imageGeneationParameters", parameters);
      onClose();
      router.push("/?scrollTo=a2i-input");
    }
    toast.info("Pre Selected Model and its parameters have been set.");
  };

  const handleUpscaleManual = () => {
    onClose();
    openConceptVisual({
      source: "blanket",
      assetItems: [galleryItem],
      asset: {
        currentAsset: galleryItem,
        galleryActions: null,
      },
      defaultActiveTab: "upscaler",
    });
  };

  const handleUpscaleAuto = async () => {
    setLoading("upscale-auto");
    try {
      await upscaleImage(selectedBrandId!, {
        image_url: galleryItem.asset_url,
        creativity: 0,
        scale_factor: "2x",
        optimized_for: "standard",
        hdr: 0,
        resemblance: 0,
        fractality: 0,
        engine: "automatic",
        prompt: "",
      });

      onClose();
      if (!propParameters) {
        router.push("/?scrollTo=a2i-input");
      }
    } catch (error) {
      console.error("Error upscaling the image:", error);
      toast.error("Error upscaling the image. Please try again.");
    } finally {
      setLoading(null);
      toast.info("Started Upscaling of the Image.");
    }
  };

  const handleModifyEdit = () => {
    onClose();
    setSelectedRemixModelById("gemini-2.5-flash-image-preview-remix");
    openConceptVisual({
      source: "blanket",
      assetItems: [galleryItem],
      asset: {
        currentAsset: galleryItem,
        galleryActions: null,
      },
      defaultActiveTab: "remix",
    });
  };

  const handleModifyReference = () => {
    if (
      MODELS_WITHOUT_REFERENCE_IMAGE.includes(parameters?.model) ||
      parameters?.model === "seedream-4-0-250828" ||
      isDisabledType
    ) {
      setSelectedImageGenerationModelById("seedream-4-0-250828");
      setParameters("referenceImageParameterArray", [galleryItem.asset_url]);
    } else if (
      parameters?.model === "gpt-image-1" ||
      parameters?.model === "gemini-2.5-flash-image-preview"
    ) {
      setSelectedImageGenerationModelById(parameters.model);
      setParameters("referenceImageParameterArray", [galleryItem.asset_url]);
    } else {
      setSelectedImageGenerationModelById(parameters?.model);
      setParameters("referenceImageParameterString", galleryItem.asset_url);
    }
    onClose();
    router.push("/?scrollTo=a2i-input");
    toast.info("Pre Selected Model and Reference Image have been set.");
  };

  const handleAnimateManual = () => {
    onClose();
    setSelectedVideoGenearationModelById("seedance-1-0-pro-250528");
    openConceptVisual({
      source: "blanket",
      assetItems: [galleryItem],
      asset: {
        currentAsset: galleryItem,
        galleryActions: null,
      },
      defaultActiveTab: "video-generation",
    });
  };

  const handleAnimatePreset = async (preset: "dynamic" | "smooth") => {
    setLoading(`animate-${preset}`);
    try {
      const prompt = await generateAnimationPrompt(preset, parameters?.prompt);
      const model = models.find((m) => m.id === "seedance-1-0-pro-250528");
      const { defaultValues } = useDynamicModelSchema(model!);
      await videoGenerationService(selectedBrandId!, {
        ...defaultValues,
        first_frame: galleryItem.asset_url,
        prompt,
        model: model!.id,
      });
      onClose();
      if (!propParameters) {
        router.push("/?scrollTo=a2i-input");
      }
    } catch (error) {
      console.error("Error animating the image:", error);
      toast.error("Error animating the image. Please try again.");
    } finally {
      setLoading(null);
      toast.info("Started Video Generation with " + preset + " Animation");
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
        <div className="flex items- justify-center items-stretch  flex-1 min-w-[80vw] max-w-[80vw] max-h-[80vh]">
          <div className="relative rounded-l-lg  group flex items-center justify-center w-[70%] h-[80vh] overflow-hidden bg-white border-r">
            <img
              src={galleryItem.asset_url}
              alt={
                parameters?.prompt ??
                galleryItem.input_prompt ??
                "Expanded image"
              }
              className="w-full h-full object-contain relative"
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
          <div className="rounded-r-lg bg-background h-auto w-[30%] p-4 flex flex-col gap-y-4 overflow-y-auto">
            {isFetchingParams ? (
              // Loading State
              <div className="flex items-center justify-center flex-col gap-2 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Loading parameters...
                </p>
              </div>
            ) : (
              <>
                {parameters && (
                  <>
                    {/* Prompt */}
                    {parameters?.prompt && (
                      <div className="space-y-2">
                        <p>Prompt</p>
                        <div className="relative">
                          <Textarea
                            value={parameters.prompt}
                            className="max-h-40 lg:max-h-50 focus:outline-none resize-none py-2 px-4"
                            readOnly
                          />
                          <TooltipButton
                            className="absolute top-2 right-2 text-muted-foreground"
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
                    {referenceImages?.length > 0 && (
                      <div>
                        <p>Reference Image(s)</p>
                        <div className="mt-2 w-full overflow-x-auto">
                          <div className="flex flex-row gap-x-2 w-max">
                            {referenceImages.map((img: string, idx: number) => (
                              <ZoomableImage
                                key={idx}
                                src={img}
                                className="w-16 h-16 object-cover rounded border cursor-pointer flex-shrink-0"
                                variant="default"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-muted-foreground">
                      {parameters.model}
                      {getDimensionAndAspectRatioFromParameters(parameters)}
                    </p>
                  </>
                )}

                {/* Metadata Action Buttons (always visible) */}
                <div className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <p className="w-24">Vary</p>
                    <div className="flex flex-1 gap-x-2 items-start">
                      <Button
                        onClick={handleVaryAuto}
                        disabled={loading === "vary-auto" || isDisabledType}
                        loading={loading === "vary-auto"}
                      >
                        Auto
                      </Button>
                      <Button
                        onClick={handleVaryManual}
                        disabled={isDisabledType}
                      >
                        Manual
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="w-24">Upscale</p>
                    <div className="flex flex-1 gap-2 items-start flex-wrap">
                      <Button
                        disabled={loading === "upscale-auto"}
                        loading={loading === "upscale-auto"}
                        onClick={handleUpscaleAuto}
                      >
                        Auto
                      </Button>
                      <Button onClick={handleUpscaleManual}>Manual</Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="w-24">Modify</p>
                    <div className="flex flex-1 gap-2 items-start flex-wrap">
                      <Button onClick={handleModifyEdit}>Edit</Button>
                      <Button onClick={handleModifyReference}>Reference</Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="w-24">Animate</p>
                    <div className="flex flex-1 gap-2 items-start flex-wrap">
                      <Button
                        onClick={() => handleAnimatePreset("dynamic")}
                        disabled={loading === "animate-dynamic"}
                        loading={loading === "animate-dynamic"}
                      >
                        Dynamic
                      </Button>
                      <Button
                        onClick={() => handleAnimatePreset("smooth")}
                        disabled={loading === "animate-smooth"}
                        loading={loading === "animate-smooth"}
                      >
                        Smooth
                      </Button>
                      <Button onClick={handleAnimateManual}>Manual</Button>
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

export default ImageWithMetadataModal;
