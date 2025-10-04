import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn, PlatformApiError } from "@/lib/utils";
import { generateImage } from "@/services/api/a2i.service";
import { deleteFile, uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useBrandStore } from "@/store/brand.store";
import { Images, Loader2, Settings2, WandSparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { z, ZodTypeAny } from "zod";
import { DynamicFormField } from "./DynamicFormField";
import { FileParam, ModelParameter } from "@/types/a2i-media.types";
import { useMutation } from "@tanstack/react-query";
import { enhancePrompt } from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { useModelsStore } from "@/store/models.store";
import { useA2iStore } from "@/store/a2i.store";
import useModelPricing from "@/hooks/useModelPricing";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useA2iForm } from "@/hooks/useA2iForm";
import { useCreditsStore } from "@/store/credits.store";
import { useQueryState } from "nuqs";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";

const A2iImageInput = ({
  referenceMoodboardId,
  campaignInformation,
  selectedCampaignIndex,
}: {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  campaignInformation: ThreadDetails["campaign_information"];
  selectedCampaignIndex: number;
}) => {
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTo, setScrollTo] = useQueryState("scrollTo");
  const { parameters, setParameters } = useMetadataActionsStore();
  const { selectedImageGenerationModel } = useModelsStore();
  const form = useA2iForm({
    // How to make this unique {What serice this form is for}-{Selected model id}
    formKey: `image-generation-${selectedImageGenerationModel!.id}`,
    selectedModel: selectedImageGenerationModel,
  });
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedImageGenerationModel,
  });
  const { selectedBrandId } = useBrandStore();
  const { referencePrompt, referencePromptSignal, clearReferencePrompt } =
    useA2iStore();
  const { mutate: handleEnhancePrompt, isPending } = useMutation({
    mutationFn: () =>
      enhancePrompt(
        selectedBrandId!,
        form.getValues("prompt"),
        referenceMoodboardId
      ),
    onSuccess: () => {
      clearReferencePrompt();
    },
  });

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  // Reference to the file input element
  const { refernceImagesModelInfo, initialParams, advancedParams } =
    useMemo(() => {
      let fileParam: FileParam | null = null;
      const initialParams: ModelParameter[] = [];
      const advancedParams: ModelParameter[] = [];

      for (const param of selectedImageGenerationModel?.parameters ?? []) {
        if (param.type === "file") {
          fileParam = param as FileParam;
        } else if (param.category === "initial" && param.id !== "prompt") {
          initialParams.push(param);
        } else if (param.category === "advanced") {
          advancedParams.push(param);
        }
      }

      return {
        refernceImagesModelInfo: fileParam,
        initialParams,
        advancedParams,
      };
    }, [selectedImageGenerationModel]);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageBlocks, setImageBlocks] = useState<
    {
      previewUrl: string;
      url: string | null;
    }[]
  >([]);

  // Store the current prompt value to preserve it across model changes
  const remainingUploads = refernceImagesModelInfo
    ? refernceImagesModelInfo?.maxLimit - imageBlocks.length
    : 0;

  const onDrop = useCallback(
    async (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: any
    ) => {
      if (event?.target) {
        event.target.value = null;
      }
      if (fileRejections.length > 0) {
        if (remainingUploads === 0)
          toast.error(
            `Maximum limit reached. You can only upload ${refernceImagesModelInfo?.maxLimit} image(s).`
          );
        else
          toast.warning(
            `Some files were rejected. Please note: Maximum file size is ${
              refernceImagesModelInfo?.maxFileSizeLimit
            } MB, allowed file types are ${refernceImagesModelInfo?.fileTypes.join(
              ", "
            )}, and you can upload up to ${remainingUploads} more image(s).`
          );
      }

      if (acceptedFiles.length === 0 || !refernceImagesModelInfo) return;

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

              const formName = refernceImagesModelInfo.id;

              const value =
                refernceImagesModelInfo.maxLimit > 1
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
    [refernceImagesModelInfo?.id, remainingUploads]
  );

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: refernceImagesModelInfo
      ? refernceImagesModelInfo?.maxLimit > 1
      : false,
    accept: Object.fromEntries(
      (refernceImagesModelInfo?.fileTypes ?? []).map((type) => [type, []])
    ),
    preventDropOnDocument: true,
    disabled:
      isUploading ||
      form.formState.isSubmitting ||
      remainingUploads <= 0 ||
      !refernceImagesModelInfo,
    maxFiles: refernceImagesModelInfo
      ? refernceImagesModelInfo?.maxLimit - imageBlocks.length
      : 0,
    maxSize: refernceImagesModelInfo
      ? refernceImagesModelInfo?.maxFileSizeLimit * 1024 * 1024
      : 0, // Convert MB to bytes
  });

  function removeReferenceImage(urlToRemove: string) {
    const formName = refernceImagesModelInfo!.id;
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

  const onSubmit = async (data: z.infer<ZodTypeAny>) => {
    try {
      if (selectedImageGenerationModel?.prefix) {
        data.prompt = `${selectedImageGenerationModel.prefix} ${data.prompt}`;
      }

      if (selectedImageGenerationModel?.finetune_id) {
        data.finetune_id = selectedImageGenerationModel.finetune_id;
      }

      await generateImage(selectedBrandId!, {
        ...data,
        campaign_id: currentCampaign?.id || null,
      });

      form.setValue("prompt", "");
      if (refernceImagesModelInfo) {
        form.setValue(refernceImagesModelInfo.id, null);
      }
      setImageBlocks([]);
      clearReferencePrompt();
    } catch (error) {
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate image. Please try again.");
    } finally {
      form.trigger();
    }
  };

  // Handle reference prompt changes
  useEffect(() => {
    if (referencePrompt) {
      form.setValue("prompt", referencePrompt, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [referencePrompt, form, referencePromptSignal]);

  // This useEffect is to populate the prompt value when the model changes
  useEffect(() => {
    // Clean up uploaded files when model changes
    for (const block of imageBlocks) {
      if (block.url) {
        deleteFile(block.url);
      }
    }

    setImageBlocks([]);
    if (refernceImagesModelInfo) {
      form.setValue(refernceImagesModelInfo.id, null, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [selectedImageGenerationModel?.id]);

  // This useEffect is to fetch reference images stored in the session storage and populate the image blocks
  useEffect(() => {
    if (refernceImagesModelInfo) {
      const referenceImages = form.getValues(refernceImagesModelInfo.id);

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
  }, [form, selectedImageGenerationModel?.id]);

  useEffect(() => {
    if (scrollTo === "a2i-input" && inputContainerRef.current) {
      inputContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      // reset so it doesn’t scroll again unnecessarily
      setScrollTo(null);
    }
  }, [scrollTo, setScrollTo]);

  useEffect(() => {
    if (parameters.imageGeneationParameters) {
      const paramName = refernceImagesModelInfo?.id;

      form.reset({
        ...form.getValues(),
        ...parameters.imageGeneationParameters,
        ...(paramName ? { [paramName]: null } : {}),
      });

      form.trigger();
      setParameters("imageGeneationParameters", null);
    }
    if (parameters.referenceImageParameterArray) {
      const paramName = refernceImagesModelInfo?.id;
      if (paramName) {
        form.reset({
          ...form.getValues(),
          [paramName]: parameters.referenceImageParameterArray,
        });
        form.trigger();

        setImageBlocks(
          parameters.referenceImageParameterArray.map((url) => ({
            previewUrl: url,
            url: url,
          }))
        );

        setParameters("referenceImageParameterArray", null);
      }
    }
    if (parameters.referenceImageParameterString) {
      const paramName = refernceImagesModelInfo?.id;
      if (paramName) {
        form.reset({
          ...form.getValues(),
          [paramName]: parameters.referenceImageParameterString,
        });
        form.trigger();

        setImageBlocks([
          {
            previewUrl: parameters.referenceImageParameterString,
            url: parameters.referenceImageParameterString,
          },
        ]);

        setParameters("referenceImageParameterString", null);
      }
    }
  }, [parameters]);

  // For seedream 4 model, ensure that the total number of images (reference + to generate) does not exceed 15
  const value = form.watch("max_images");
  const numberOfReferenceImagesUploaded = refernceImagesModelInfo
    ? form.watch(refernceImagesModelInfo.id)?.length || 0
    : 0;

  useEffect(() => {
    const total = numberOfReferenceImagesUploaded + value;

    if (total > 15) {
      const newValue = Math.max(1, 15 - numberOfReferenceImagesUploaded);
      form.setValue("max_images", newValue);
      toast.info(
        `The maximum number of images to generate has been adjusted to ${newValue} due to the number of reference images uploaded.`
      );
    }
  }, [numberOfReferenceImagesUploaded, value, form]);

  return (
    <div
      ref={inputContainerRef}
      className="flex flex-col items-stretch w-full max-w-2xl mx-auto border resize-none rounded-2xl sticky bottom-8 h-max bg-background scrollbar overflow-hidden shadow-2xl z-[10] pb-4"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {imageBlocks.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-2">
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
                  <div className="relative h-full">
                    <Textarea
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) {
                          // Allow new line on Shift + Enter
                          return;
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      className={cn(
                        "relative w-full resize-none border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-[20px] max-h-[200px] overflow-y-auto align-top"
                      )}
                      placeholder="Describe what you want to see ..."
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex gap-2 justify-between items-center px-4">
            <div className="flex items-center gap-2">
              {refernceImagesModelInfo && (
                <div>
                  <input {...getInputProps()} ref={inputFileRef} />
                  <TooltipIconButton
                    tooltip={
                      refernceImagesModelInfo.maxLimit - imageBlocks.length <= 0
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
                      refernceImagesModelInfo?.maxLimit - imageBlocks.length <=
                      0
                    }
                  >
                    <Images />
                  </TooltipIconButton>
                </div>
              )}

              {initialParams.map((param) => {
                return (
                  <DynamicFormField
                    key={param.id}
                    param={param}
                    form={form}
                    type="initial"
                    rules={selectedImageGenerationModel?.rules}
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
                    align="center"
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
                            rules={selectedImageGenerationModel?.rules}
                          />
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex gap-x-2">
              <Button
                type="button"
                disabled={!form.watch("prompt") || isPending}
                variant={"outline"}
                className="border-primary text-primary"
                onClick={() => {
                  if (!form.getValues("prompt")) return;
                  handleEnhancePrompt(undefined, {
                    onSuccess: (data) => {
                      form.setValue("prompt", data.prompt, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });

                      toast.success("Prompt enhanced successfully!");
                    },
                    onError: () => {
                      toast.error(
                        "Failed to enhance prompt. Please try again."
                      );
                    },
                  });
                }}
              >
                <WandSparkles />
                {isPending ? "Enhancing Prompt..." : "Enhance Prompt"}
              </Button>
              <Button
                disabled={
                  !form.formState.isValid ||
                  form.formState.isSubmitting ||
                  isUploading ||
                  isPending ||
                  isCalculatingCredits
                }
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <div className="flex gap-x-1 items-center text-sm">
                    <p>Generate</p>
                    <p>
                      {isCalculatingCredits ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        `(${credits} credits)`
                      )}
                    </p>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default A2iImageInput;
