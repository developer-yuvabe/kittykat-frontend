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
import { cn, delay, PlatformApiError } from "@/lib/utils";
import { generateImage } from "@/services/api/a2i.service";
import { deleteFile, uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useBrandStore } from "@/store/brand.store";
import { Images, Loader2, Settings2, WandSparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { z, ZodTypeAny } from "zod";
import { DynamicFormField } from "./DynamicFormField";
import { FileParam } from "@/types/a2i-media.types";
import { useMutation } from "@tanstack/react-query";
import { enhancePrompt } from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { useModelsStore } from "@/store/models.store";
import { useImageGenForm } from "@/hooks/useImageGenForm";
import { useA2iStore } from "@/store/a2i.store";
import A2iImageInputLoader from "./A2iImageInputLoader";
import useModelPricing from "@/hooks/useModelPricing";
import { useUserStore } from "@/store/user.store";

const A2iImageInput = ({
  referenceMoodboardId,
  campaignInformation,
  selectedCampaignIndex,
}: {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  campaignInformation: ThreadDetails["campaign_information"];
  selectedCampaignIndex: number;
}) => {
  const form = useImageGenForm();
  const { setShowInsufficientCreditsModal } = useUserStore();
  const { credits, isCalculatingCredits } = useModelPricing({ form });
  const { selectedModel, isModelsFetched } = useModelsStore();
  const { selectedBrandId } = useBrandStore();
  const { referencePrompt, setReferencePrompt } = useA2iStore();
  const { mutate: handleEnhancePrompt, isPending } = useMutation({
    mutationFn: () =>
      enhancePrompt(
        selectedBrandId!,
        form.getValues("prompt"),
        referenceMoodboardId
      ),
  });

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  // Reference to the file input element
  const refernceImagesModelInfo = useMemo(
    () =>
      selectedModel?.parameters?.find(
        (param) => param.type === "file"
      ) as FileParam,
    [selectedModel]
  );
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageBlocks, setImageBlocks] = useState<
    {
      previewUrl: string;
      url: string | null;
    }[]
  >([]);

  // Store the current prompt value to preserve it across model changes
  const [currentPromptValue, setCurrentPromptValue] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

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
    [refernceImagesModelInfo?.id]
  );

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: refernceImagesModelInfo?.maxLimit > 1,
    accept: Object.fromEntries(
      (refernceImagesModelInfo?.fileTypes ?? []).map((type) => [type, []])
    ),
    preventDropOnDocument: true,
    disabled:
      isUploading ||
      form.formState.isSubmitting ||
      refernceImagesModelInfo?.maxLimit - imageBlocks.length <= 0,
    maxFiles: refernceImagesModelInfo?.maxLimit - imageBlocks.length,
    maxSize: refernceImagesModelInfo?.maxFileSizeLimit * 1024 * 1024, // Convert MB to bytes
  });

  function removeReferenceImage(urlToRemove: string) {
    const formName = refernceImagesModelInfo.id;
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
    if (selectedModel?.prefix) {
      data.prompt = `${selectedModel.prefix} ${data.prompt}`;
    }

    if (selectedModel?.finetune_id) {
      data.finetune_id = selectedModel.finetune_id;
    }

    const campaignId = currentCampaign?.id || null;

    data.campaign_id = campaignId;

    generateImage(selectedBrandId!, data).catch((error) => {
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
      }
    });

    await delay(2000);

    form.reset();
    if (referencePrompt) setReferencePrompt(null);
    setImageBlocks([]);
    setCurrentPromptValue(""); // Clear the stored prompt value
  };

  // Watch for changes in the form prompt field to keep our state in sync
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.prompt !== undefined) {
        setCurrentPromptValue(value.prompt);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle reference prompt changes
  useEffect(() => {
    if (referencePrompt) {
      form.setValue("prompt", referencePrompt, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setCurrentPromptValue(referencePrompt);
    }
  }, [referencePrompt, form]);

  // Handle model changes - preserve the current prompt value
  useEffect(() => {
    // Clean up uploaded files when model changes
    for (const block of imageBlocks) {
      if (block.url) {
        deleteFile(block.url);
      }
    }

    setImageBlocks([]);

    // Preserve the current prompt value when model changes
    if (currentPromptValue) {
      queueMicrotask(() => {
        form.setValue("prompt", currentPromptValue, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      });
    }
  }, [selectedModel?.id]);

  return (
    <div className="flex flex-col items-stretch w-full max-w-2xl mx-auto border resize-none rounded-2xl sticky bottom-8 h-max bg-background scrollbar overflow-hidden shadow-2xl z-10 pb-4">
      {!isModelsFetched ? (
        <A2iImageInputLoader />
      ) : (
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
                          setCurrentPromptValue(e.target.value);
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
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => inputFileRef.current?.click()}
                      disabled={
                        refernceImagesModelInfo?.maxLimit -
                          imageBlocks.length <=
                        0
                      }
                    >
                      <Images />
                    </Button>
                  </div>
                )}

                {selectedModel?.parameters
                  ?.filter((param) => param.category === "initial")
                  .map((param) => {
                    return (
                      <DynamicFormField
                        key={param.id}
                        param={param}
                        form={form}
                        type="initial"
                        rules={selectedModel?.rules}
                      />
                    );
                  })}

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
                      {selectedModel?.parameters
                        ?.filter((param) => param.category === "advanced")
                        .map((param) => {
                          return (
                            <DynamicFormField
                              key={param.id}
                              param={param}
                              form={form}
                              type="advanced"
                              rules={selectedModel?.rules}
                            />
                          );
                        })}
                    </div>
                  </PopoverContent>
                </Popover>
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
                        setCurrentPromptValue(data.prompt);

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
      )}
    </div>
  );
};

export default A2iImageInput;
