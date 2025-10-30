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
import { useBrandStore } from "@/store/brand.store";
import { Settings2, WandSparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z, ZodTypeAny } from "zod";
import { DynamicFormField } from "./DynamicFormField";
import { FileParam, ModelParameter } from "@/types/a2i-media.types";
import { useMutation } from "@tanstack/react-query";
import { enhancePrompt } from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { ThreadA2iImage, ThreadCampaign } from "@/types/types";
import { useModelsStore } from "@/store/models.store";
import { useA2iStore } from "@/store/a2i.store";
import useModelPricing from "@/hooks/useModelPricing";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useA2iForm } from "@/hooks/useA2iForm";
import { useCreditsStore } from "@/store/credits.store";
import { useQueryState } from "nuqs";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import TokenGenerateButton from "@/components/shared/TokenGenerateButton";
import ModelSelector from "./ModelSelector";
import {
  LockIcon,
  LockOpenIcon,
  MagicEnabledIcon,
  TrashIcon,
} from "@/components/ui/custom-icon";
import ReferenceImageSelector from "./ReferenceImageSelector";

const A2iImageInput = ({
  referenceMoodboardId,
  currentCampaign,
}: {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  currentCampaign: ThreadCampaign | null;
}) => {
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTo, setScrollTo] = useQueryState("scrollTo");
  const { parameters, setParameters } = useMetadataActionsStore();
  const { selectedImageGenerationModel, setSelectedImageGenerationModel } =
    useModelsStore();
  const formInstance = useA2iForm({
    formKey: `image-generation`,
    selectedModel: selectedImageGenerationModel,
  });
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { credits, isCalculatingCredits: isCalculatingTokens } =
    useModelPricing({
      form: formInstance,
      model: selectedImageGenerationModel,
    });
  const { selectedBrandId } = useBrandStore();
  const { referencePrompt, referencePromptSignal, clearReferencePrompt } =
    useA2iStore();
  const { mutate: handleEnhancePrompt, isPending: isEnhancingPrompt } =
    useMutation({
      mutationFn: () =>
        enhancePrompt(
          selectedBrandId!,
          formInstance.getValues("prompt"),
          referenceMoodboardId
        ),
      onSuccess: () => {
        clearReferencePrompt();
      },
    });

  const { referenceImagesModelInfo, initialParams, advancedParams } =
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
        referenceImagesModelInfo: fileParam,
        initialParams,
        advancedParams,
      };
    }, [selectedImageGenerationModel]);

  const [masterReference, setMasterReference] = useState<string[]>([]);
  const [productReference, setProductReference] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const currentImageCount = masterReference.length + productReference.length;

  function clearPromptAndReferences() {
    formInstance.setValue("prompt", "", { shouldValidate: true });
    setMasterReference([]);
    setProductReference([]);
    clearReferencePrompt();
  }

  const onSubmit = async (data: z.infer<ZodTypeAny>) => {
    try {
      const referenceImages: string[] = [];
      referenceImages.push(...masterReference, ...productReference);

      if (referenceImagesModelInfo && referenceImages.length > 0) {
        data[referenceImagesModelInfo.id] =
          referenceImagesModelInfo.maxLimit > 1
            ? referenceImages
            : referenceImages[0];
      }

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

      if (!isLocked) {
        formInstance.setValue("prompt", "", { shouldValidate: true });
        setMasterReference([]);
        setProductReference([]);
        clearReferencePrompt();
      }
    } catch (error) {
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate image. Please try again.");
    }
  };

  useEffect(() => {
    if (referencePrompt) {
      formInstance.setValue("prompt", referencePrompt, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [referencePrompt, formInstance, referencePromptSignal]);

  useEffect(() => {
    setMasterReference([]);
    setProductReference([]);
  }, [selectedImageGenerationModel?.id]);

  useEffect(() => {
    if (scrollTo === "a2i-input") {
      const observer = new MutationObserver(() => {
        setTimeout(() => {
          if (inputContainerRef.current) {
            inputContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
            setScrollTo(null);
            observer.disconnect();
          }
        }, 50);
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [scrollTo]);

  useEffect(() => {
    if (parameters.imageGeneationParameters) {
      const paramName = referenceImagesModelInfo?.id;

      formInstance.reset({
        ...formInstance.getValues(),
        ...parameters.imageGeneationParameters,
      });

      if (paramName && parameters.imageGeneationParameters[paramName]) {
        const referenceImages = parameters.imageGeneationParameters[paramName];
        const imagesArray = Array.isArray(referenceImages)
          ? referenceImages
          : [referenceImages];

        // For now, assign all to master; can split later if needed
        setMasterReference(imagesArray);
        setProductReference([]);
      }

      formInstance.trigger();
      requestAnimationFrame(() => {
        setParameters("imageGeneationParameters", null);
      });
    }

    if (parameters.referenceImage) {
      const referenceImageUrl = parameters.referenceImage;
      setMasterReference([referenceImageUrl]);

      requestAnimationFrame(() => {
        setParameters("referenceImage", null);
      });
    }
  }, [parameters]);

  const value = formInstance.watch("max_images");

  useEffect(() => {
    const total = currentImageCount + value;

    if (total > 15) {
      const newValue = Math.max(1, 15 - currentImageCount);
      formInstance.setValue("max_images", newValue);
      toast.info(
        `The maximum number of images to generate has been adjusted to ${newValue} due to the number of reference images uploaded.`
      );
    }
  }, [currentImageCount, value, formInstance]);

  return (
    <div
      ref={inputContainerRef}
      className="flex flex-col items-stretch w-full mx-auto border resize-none rounded-2xl bottom-8 h-max bg-background scrollbar overflow-hidden pb-4"
      id="concept-visual-playground"
    >
      <Form {...formInstance}>
        <div
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            formInstance.handleSubmit(onSubmit)();
          }}
        >
          {(masterReference.length > 0 || productReference.length > 0) && (
            <div className="flex flex-wrap gap-2 px-4 pt-2">
              {[
                ...masterReference.map((url) => ({
                  url,
                  type: "master" as const,
                })),
                ...productReference.map((url) => ({
                  url,
                  type: "product" as const,
                })),
              ].map((ref, index) => (
                <div key={ref.url} className="relative w-12 h-12 rounded-lg">
                  <img
                    src={ref.url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      if (ref.type === "master") {
                        setMasterReference(
                          masterReference.filter((u) => u !== ref.url)
                        );
                      } else {
                        setProductReference(
                          productReference.filter((u) => u !== ref.url)
                        );
                      }
                    }}
                    className="p-1 absolute -top-1 -right-1 bg-primary rounded-full text-white hover:bg-destructive z-10"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <FormField
            control={formInstance.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative h-full">
                    <Textarea
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (referencePrompt) {
                          clearReferencePrompt();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) {
                          return;
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          formInstance.handleSubmit(onSubmit)();
                        }
                      }}
                      className={cn(
                        "relative w-full resize-none mt-5 border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-[80px] max-h-[200px] overflow-y-auto align-top"
                      )}
                      placeholder="Describe what you want to see ..."
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <TooltipButton
                        tooltip="Magic enhance (feature coming soon)"
                        icon={<MagicEnabledIcon color="#6B5FBA" size={22} />}
                        size="md"
                        className="px-2 py-2"
                        onClick={() => {
                          toast.info("Magic enhance feature coming soon!");
                        }}
                      />
                      <TooltipButton
                        tooltip={
                          isLocked
                            ? "Keep prompt and reference images after generation."
                            : "Clear prompt and references after generation."
                        }
                        icon={
                          isLocked ? (
                            <LockIcon color="#6B5FBA" size={20} />
                          ) : (
                            <LockOpenIcon color="#6B5FBA" size={20} />
                          )
                        }
                        size="md"
                        className="px-2 py-2"
                        onClick={() => setIsLocked(!isLocked)}
                      />
                      <TooltipButton
                        tooltip="Clear prompt and references"
                        icon={<TrashIcon color="#6B5FBA" size={20} />}
                        size="md"
                        className="px-2 py-2"
                        onClick={() => clearPromptAndReferences()}
                      />
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex gap-2 justify-between items-center px-4">
            <div className="flex items-center gap-2">
              {referenceImagesModelInfo && (
                <ReferenceImageSelector
                  masterReference={masterReference}
                  productReference={productReference}
                  onMasterReferenceChange={setMasterReference}
                  onProductReferenceChange={setProductReference}
                  maxLimit={referenceImagesModelInfo.maxLimit}
                  fileTypes={referenceImagesModelInfo.fileTypes}
                  maxFileSizeLimit={referenceImagesModelInfo.maxFileSizeLimit}
                  disabled={formInstance.formState.isSubmitting}
                  currentCampaignId={currentCampaign?.id}
                />
              )}

              {initialParams.map((param) => {
                return (
                  <DynamicFormField
                    key={param.id}
                    param={param}
                    form={formInstance}
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
                            form={formInstance}
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
              <ModelSelector
                onModelChange={setSelectedImageGenerationModel}
                selectedModel={selectedImageGenerationModel}
                typeFilter="image"
              />
              <Button
                type="button"
                disabled={!formInstance.watch("prompt") || isEnhancingPrompt}
                variant={"outline"}
                className="border-primary text-primary"
                onClick={() => {
                  if (!formInstance.getValues("prompt")) return;
                  handleEnhancePrompt(undefined, {
                    onSuccess: (data) => {
                      formInstance.setValue("prompt", data.prompt, {
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
                {isEnhancingPrompt ? "Enhancing Prompt..." : "Enhance Prompt"}
              </Button>
              <TokenGenerateButton
                onClick={() => formInstance.handleSubmit(onSubmit)()}
                tokens={credits}
                loading={formInstance.formState.isSubmitting}
                disabled={
                  !formInstance.formState.isValid ||
                  formInstance.formState.isSubmitting ||
                  isEnhancingPrompt
                }
                isCalculatingTokens={isCalculatingTokens}
              />
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default A2iImageInput;
