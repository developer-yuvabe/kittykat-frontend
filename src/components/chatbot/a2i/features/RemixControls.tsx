import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { BrushIcon } from "@/components/ui/custom-icon";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AppConfig } from "@/config/app.config";
import { useA2iForm } from "@/hooks/useA2iForm";
import useModelPricing from "@/hooks/useModelPricing";
import { canvasToBlob, PlatformApiError } from "@/lib/utils";
import { deleteFile, uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { remixImageService } from "@/services/api/remix.service";
import { useBrandStore } from "@/store/brand.store";
import { useCreditsStore } from "@/store/credits.store";
import { useModelsStore } from "@/store/models.store";
import { FileParam, ModelParameter } from "@/types/a2i-media.types";
import {
  BrainIcon,
  Eraser,
  Images,
  Loader2,
  Redo,
  Settings2,
  Undo,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { DynamicFormField } from "../DynamicFormField";
import ModelSelector from "../ModelSelector";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useRouter } from "next/router";

export type RemixControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  image: {
    url: string;
    size: string;
  };
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  // Add brush size props
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brandId?: string;
};

const RemixControls = ({
  image,
  offScreenCanvasRef,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  brushSize,
  onBrushSizeChange,
  brandId,
}: RemixControlsProps) => {
  const router = useRouter();
  const { closeConceptVisual, source } = useConceptVisualStore();
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { selectedBrandId, selectedCampaignId: campaignId } = useBrandStore();
  const { selectedRemixModel, setSelectedRemixModel } = useModelsStore();

  const {
    initialParams,
    advancedParams,
    referenceImageParam,
    baseImageParam,
    maskImageParam,
  } = useMemo(() => {
    const initialParams: ModelParameter[] = [];
    const advancedParams: ModelParameter[] = [];
    let referenceImageParam: FileParam | null = null;
    let baseImageParam = null;
    let maskImageParam = null;

    for (const param of selectedRemixModel?.parameters || []) {
      if (["base_image", "image"].includes(param.id) && param.type !== "file") {
        baseImageParam = param;
        continue;
      }

      if (["reference_images", "image"].includes(param.id)) {
        referenceImageParam = param as FileParam;
        continue;
      }

      if (["mask_image"].includes(param.id)) {
        maskImageParam = param;
        continue;
      }

      if (param.category === "initial" && param.id !== "prompt") {
        initialParams.push(param);
      } else if (param.category === "advanced") {
        advancedParams.push(param);
      }
    }

    return {
      initialParams,
      advancedParams,
      referenceImageParam,
      baseImageParam,
      maskImageParam,
    };
  }, [selectedRemixModel]);

  const form = useA2iForm({
    selectedModel: selectedRemixModel,
    formKey: "remixForm",
    dynamicDefualtValues: {
      ...(baseImageParam?.id && image.url
        ? { [baseImageParam.id]: image.url }
        : {}),
    },
  });

  useEffect(() => {
    if (image.url && baseImageParam) {
      form.setValue(baseImageParam.id, image.url);
    }
  }, [image]);

  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedRemixModel,
  });
  const inputFileRef = React.useRef<HTMLInputElement | null>(null);

  // Image
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageBlocks, setImageBlocks] = React.useState<
    {
      previewUrl: string;
      url: string | null;
    }[]
  >([]);
  const remainingUploads =
    (referenceImageParam?.maxLimit || 0) - imageBlocks.length;

  const onDrop = useCallback(
    async (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: any
    ) => {
      // Reset file input value to allow re-uploading the same file
      if (event?.target) {
        event.target.value = null;
      }
      if (fileRejections.length > 0) {
        if (remainingUploads === 0)
          toast.error(
            `Maximum limit reached. You can only upload ${referenceImageParam?.maxLimit} image(s).`
          );
        else
          toast.warning(
            `Some files were rejected. Please note: Maximum file size is ${
              referenceImageParam?.maxFileSizeLimit
            } MB, allowed file types are ${referenceImageParam?.fileTypes.join(
              ", "
            )}, and you can upload up to ${remainingUploads} more image(s).`
          );
      }

      if (acceptedFiles.length === 0 || !referenceImageParam) return;

      setIsUploading(true);

      const uploadPromises = acceptedFiles.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = async () => {
            const previewUrl = reader.result as string;
            let blockIndex = -1;

            setImageBlocks((prev) => {
              blockIndex = prev.length;
              return [...prev, { previewUrl, url: null }];
            });

            try {
              const uploadedUrl = await uploadFileAndReturnUrl(
                file.name,
                file.type,
                "brands",
                file,
                selectedBrandId || null
              );

              setImageBlocks((prev) => {
                const updated = [...prev];
                updated[blockIndex] = {
                  ...updated[blockIndex],
                  url: uploadedUrl,
                };
                return updated;
              });

              const formName = referenceImageParam.id;

              const value =
                referenceImageParam.maxLimit > 1
                  ? [...(form.getValues(formName) || []), uploadedUrl]
                  : uploadedUrl;

              form.setValue(formName, value, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
            } catch {
              console.error("Upload failed for", file.name);
              setImageBlocks((prev) =>
                prev.filter((_, idx) => idx !== blockIndex)
              );
            } finally {
              resolve();
            }
          };

          reader.readAsDataURL(file);
        });
      });

      await Promise.allSettled(uploadPromises);
      setIsUploading(false);
    },
    [referenceImageParam?.id, remainingUploads]
  );

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
    },
    disabled: isUploading || 10 - imageBlocks.length <= 0,
    maxFiles: 10 - imageBlocks.length,
    maxSize: AppConfig.MAX_FILE_SIZE,
  });

  function removeReferenceImage(urlToRemove: string) {
    const formName = referenceImageParam!.id;
    const currentImages = form.getValues(formName);

    if (!currentImages) return;

    let updatedImages;
    if (Array.isArray(currentImages)) {
      updatedImages = currentImages.filter((url) => url !== urlToRemove);
    }
    form.setValue(formName, updatedImages);

    // Remove from imageBlocks
    setImageBlocks((prev) => prev.filter((block) => block.url !== urlToRemove));

    // delete the file from GCS
    deleteFile(urlToRemove);
  }

  const onSubmit = async (data: Record<string, any>) => {
    try {
      let maskUrl = null;

      if (maskImageParam) {
        const offScreenCanvas = offScreenCanvasRef.current;
        if (!offScreenCanvas) return;

        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = offScreenCanvas.width;
        compositeCanvas.height = offScreenCanvas.height;

        const compositeCtx = compositeCanvas.getContext("2d");
        if (!compositeCtx) throw new Error("Failed to get canvas context");

        compositeCtx.fillStyle = "black";
        compositeCtx.fillRect(
          0,
          0,
          compositeCanvas.width,
          compositeCanvas.height
        );

        compositeCtx.globalCompositeOperation = "lighten";
        compositeCtx.drawImage(offScreenCanvas, 0, 0);

        compositeCtx.globalCompositeOperation = "source-over";

        const blob = await canvasToBlob(compositeCanvas, "image/png");
        const file = new File([blob], "mask-image.png", {
          type: "image/png",
        });

        maskUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "remix",
          file
        );
      }

      await remixImageService(
        brandId ?? selectedBrandId!,
        campaignId,
        data,
        maskUrl
      );

      form.setValue("prompt", "");
      if (referenceImageParam) {
        form.setValue(referenceImageParam.id, null);
      }
      setImageBlocks([]);

      closeConceptVisual();
      if (source === "blanket") {
        router.push("/?scrollTo=a2i");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to remix image. Please try again.");
    }
  };

  // This useEffect is to populate the prompt value when the model changes
  useEffect(() => {
    // Clean up uploaded files when model changes
    for (const block of imageBlocks) {
      if (block.url) {
        deleteFile(block.url);
      }
    }

    setImageBlocks([]);
    if (referenceImageParam) {
      form.setValue(referenceImageParam.id, null, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [selectedRemixModel?.id]);

  // This useEffect is to fetch reference images stored in the session storage and populate the image blocks
  useEffect(() => {
    if (referenceImageParam) {
      const referenceImages = form.getValues(referenceImageParam.id);

      if (
        referenceImages &&
        Array.isArray(referenceImages) &&
        referenceImages.length > 0
      ) {
        setImageBlocks(
          referenceImages.map((url) => ({
            previewUrl: url,
            url: url,
          }))
        );
      }
    }
  }, [form, selectedRemixModel?.id]);

  // For seedream 4 model, ensure that the total number of images (reference + to generate) does not exceed 15
  const value = form.watch("max_images");
  const numberOfReferenceImagesUploaded = referenceImageParam
    ? form.watch(referenceImageParam.id)?.length || 0
    : 0;

  useEffect(() => {
    const total = numberOfReferenceImagesUploaded + value;

    if (total > 14) {
      const newValue = Math.max(1, 14 - numberOfReferenceImagesUploaded);
      form.setValue("max_images", newValue);
      toast.info(
        `The maximum number of images to generate has been adjusted to ${newValue} due to the number of reference images uploaded.`
      );
    }
  }, [numberOfReferenceImagesUploaded, value, form]);

  return (
    <div className="w-full flex flex-col gap-y-6 p-4">
      <div className="mr-auto w-max">
        <ModelSelector
          selectedModel={selectedRemixModel}
          typeFilter="remix"
          onModelChange={(m) => {
            setSelectedRemixModel(m);
          }}
        />
      </div>
      {maskImageParam && (
        <div className="flex gap-x-4 w-full">
          <div className="flex gap-6 items-center border p-4 rounded-md flex-1">
            <BrushIcon className="text-primary" />
            <div className="flex-1 flex items-center gap-3">
              <Slider
                value={[brushSize]}
                onValueChange={(value) => onBrushSizeChange(value[0])}
                max={100}
                min={5}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-2 items-center rounded-md">
            <TooltipIconButton
              tooltip="Undo"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo size={16} />
            </TooltipIconButton>

            <TooltipIconButton
              tooltip="Redo"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo size={16} />
            </TooltipIconButton>

            <TooltipIconButton
              tooltip="Clear"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onClear}
            >
              <Eraser size={16} />
            </TooltipIconButton>
          </div>
        </div>
      )}
      <div className="bg-background rounded-2xl border shadow-xl py-6 px-4 mx-auto w-full h-max">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {imageBlocks.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageBlocks.map((block, index) => (
                    <div
                      key={block.previewUrl}
                      className="relative w-12 h-12 rounded-lg"
                    >
                      <img
                        src={block.previewUrl}
                        alt={`Uploaded preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {!!block.url && (
                        <button
                          onClick={() => removeReferenceImage(block.url!)}
                          className="p-1 absolute -top-1 -right-1 bg-primary rounded-full text-white hover:bg-destructive z-[100]"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      )}
                      {!block.url && (
                        <div className="absolute top-0 right-0 bg-black/30 text-white text-xs  px-1 flex items-center justify-center w-full h-full rounded-lg">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the image you want to create or brush an area to edit"
                        className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none min-h-10 h-max max-h-60 scrollbar mb-2 px-0"
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {referenceImageParam && (
                    <>
                      <input {...getInputProps()} ref={inputFileRef} />
                      <TooltipIconButton
                        tooltip={
                          referenceImageParam.maxLimit - imageBlocks.length <= 0
                            ? "You’ve reached the maximum upload limit"
                            : `You can add ${remainingUploads} more image${
                                remainingUploads > 1 ? "s" : ""
                              }`
                        }
                        className="size-max px-3 py-2"
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => inputFileRef.current?.click()}
                        disabled={
                          referenceImageParam?.maxLimit - imageBlocks.length <=
                          0
                        }
                      >
                        <Images />
                      </TooltipIconButton>
                    </>
                  )}
                  {initialParams.map((param) => {
                    return (
                      <DynamicFormField
                        key={param.id}
                        param={param}
                        form={form}
                        type="initial"
                        rules={selectedRemixModel?.rules}
                        source="remix"
                      />
                    );
                  })}

                  {advancedParams.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size={"icon"} variant={"outline"}>
                          <Settings2 />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        forceMount
                        align="start"
                        side="top"
                        className="space-y-2 w-64"
                      >
                        <div className="space-y-4">
                          <FormLabel className="py-0 text-xs">
                            Advance Parameters
                          </FormLabel>
                          {advancedParams.map((param) => {
                            return (
                              <DynamicFormField
                                key={param.id}
                                param={param}
                                form={form}
                                type="advanced"
                                rules={selectedRemixModel?.rules}
                                source="remix"
                              />
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <Button
                  disabled={
                    form.formState.isSubmitting ||
                    !form.formState.isValid ||
                    isUploading ||
                    isCalculatingCredits
                  }
                  loading={form.formState.isSubmitting}
                >
                  <BrainIcon />
                  Concept Visual Generation
                  <p>
                    {isCalculatingCredits ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      `(${credits} credits)`
                    )}
                  </p>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RemixControls;
