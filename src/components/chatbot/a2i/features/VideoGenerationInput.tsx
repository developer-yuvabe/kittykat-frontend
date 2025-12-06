import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import TokenGenerateButton from "@/components/shared/TokenGenerateButton";
import { Button } from "@/components/ui/button";
import { SelectIcon } from "@/components/ui/custom-icon";
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
import { useA2iForm } from "@/hooks/useA2iForm";
import useModelPricing from "@/hooks/useModelPricing";
import { cn, PlatformApiError } from "@/lib/utils";
import { videoGenerationService } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { useCreditsStore } from "@/store/credits.store";
import { useModelsStore } from "@/store/models.store";
import { useGenerationsStore } from "@/store/generations.store";
import { FileParam } from "@/types/a2i-media.types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Settings2, X } from "lucide-react";
import { useMemo, useState, useEffect, Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { DynamicFormField, DynamicFormLabel } from "../DynamicFormField";
import ModelSelector from "../ModelSelector";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useUserStore } from "@/store/user.store";

interface VideoGenerationInputProps {
  item: GalleryItemResponse | null;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
}

const VideoGenerationInput = ({
  item,
  setCurrentItem,
}: VideoGenerationInputProps) => {
  const {
    isModelsFetched,
    selectedVideoGenearationModel,
    setSelectedVideoGenearationModel,
  } = useModelsStore();
  return (
    <div className="w-full flex-1 flex flex-col gap-y-4">
      {/* Model Chooser */}
      {isModelsFetched && selectedVideoGenearationModel && (
        <>
          <div className="ml-auto w-max">
            <ModelSelector
              typeFilter="video"
              selectedModel={selectedVideoGenearationModel}
              onModelChange={(m) => {
                setSelectedVideoGenearationModel(m);
              }}
            />
          </div>
          <VideoGenerationInputControls
            item={item}
            key={item?.id}
            setCurrentItem={setCurrentItem}
          />
        </>
      )}
    </div>
  );
};

const VideoGenerationInputControls = ({
  item,
  setCurrentItem,
}: VideoGenerationInputProps) => {
  const { user } = useUserStore();
  const { source, isConceptVisualOpened } = useConceptVisualStore();
  const { selectedCampaignId: campaignId, defaultCampaignId } = useBrandStore();
  const [galleryPickerSource, setGalleryPickerSource] = useState<string | null>(
    null
  );
  const { addCurrentSessionGenerationId } = useGenerationsStore();
  const { selectedVideoGenearationModel } = useModelsStore();
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { parameters, setParameters } = useMetadataActionsStore();
  const form = useA2iForm({
    selectedModel: selectedVideoGenearationModel,
    formKey: `video-generation`,
    dynamicDefualtValues: {
      start_image: item?.asset_url || null,
      first_frame: item?.asset_url || null,
      image: item?.asset_url || null,
    },
  });

  const {
    negativePromptParam,
    firstFrameParam,
    lastFrameParam,
    initalParams,
    advancedParams,
  } = useMemo(() => {
    const params = selectedVideoGenearationModel?.parameters ?? [];

    let negativePromptParam, firstFrameParam;
    let lastFrameParam: FileParam | undefined;
    const initalParams: typeof params = [];
    const advancedParams: typeof params = [];

    for (const param of params) {
      switch (param.id) {
        case "negative_prompt":
          negativePromptParam = param;
          break;
        case "first_frame":
        case "start_image":
        case "image": // some models use "image" as the param for the first frame
          firstFrameParam = param;
          break;
        case "last_frame":
        case "end_image":
          lastFrameParam = param as FileParam;
          break;
        default:
          if (param.id === "prompt") continue;
          if (param.category === "initial") {
            initalParams.push(param);
          } else {
            advancedParams.push(param);
          }
      }
    }

    return {
      negativePromptParam,
      firstFrameParam,
      lastFrameParam,
      initalParams,
      advancedParams,
    };
  }, [selectedVideoGenearationModel]);

  useEffect(() => {
    if (isConceptVisualOpened && !item) {
      form.setValue("prompt", "", { shouldValidate: true });
      form.setValue("negative_prompt", "", { shouldValidate: true });
      form.setValue(lastFrameParam?.id ?? "", null, { shouldValidate: true });
      form.setValue(firstFrameParam?.id ?? "", null, { shouldValidate: true });
    }
  }, [isConceptVisualOpened, item, form, lastFrameParam, firstFrameParam]);

  useEffect(() => {
    const currentNegativePrompt = form.getValues("negative_prompt");
    form.setValue(lastFrameParam?.id ?? "", null, { shouldValidate: true });
    if (currentNegativePrompt) {
      form.setValue(currentNegativePrompt, { shouldValidate: true });
    }
  }, [selectedVideoGenearationModel, form]);

  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedVideoGenearationModel,
    enabled: firstFrameParam?.required
      ? !!form.getValues(firstFrameParam?.id ?? "")
      : true,
  });

  useEffect(() => {
    if (parameters.videoParameters) {
      form.reset({
        ...form.getValues(),
        ...parameters.videoParameters,
      });

      setParameters("videoParameters", null);
      form.trigger();
    }
  }, [parameters.videoParameters]);

  const onSubmit = async (data: Record<string, any>) => {
    if (galleryPickerSource) {
      return;
    }
    try {
      if (!selectedBrandId && !item?.brand_id) {
        throw new Error("Brand ID is missing.");
      }
      const { generation_id } = await videoGenerationService(selectedBrandId!, {
        ...data,
        campaign_id: campaignId || defaultCampaignId,
        team_id: user?.active_team_id,
      });

      if (Array.isArray(generation_id)) {
        generation_id.forEach((id) => addCurrentSessionGenerationId(id));
      } else if (typeof generation_id === "string") {
        addCurrentSessionGenerationId(generation_id);
      }
    } catch (err) {
      console.error("Failed to generate video:", err);
      if (err instanceof PlatformApiError && err.statusCode == 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate video. Please try again.");
    } finally {
      form.setValue("prompt", "", { shouldValidate: true });
      if (source === "blanket" && firstFrameParam) {
        form.setValue(firstFrameParam.id, null, { shouldValidate: true });
      }
      if (source === "blanket" && lastFrameParam) {
        form.setValue(lastFrameParam.id, null, { shouldValidate: true });
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-6 h-full"
      >
        <div className="flex flex-col gap-y-6 h-full">
          {/* Frames */}
          <div className="h-full flex gap-x-2">
            {firstFrameParam && (
              <FormField
                control={form.control}
                name={firstFrameParam.id}
                render={({ field }) => (
                  <FormItem className="flex flex-col h-full w-full">
                    <DynamicFormLabel
                      label="First Frame"
                      optional={!firstFrameParam.required}
                      className="text-base text-foreground font-normal shrink-0"
                    />
                    <FormControl>
                      <div className="relative w-full h-full bg-muted">
                        {field.value ? (
                          <img
                            src={field.value}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setGalleryPickerSource(firstFrameParam.id)
                            }
                            className="w-full h-full border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer flex-col gap-y-2 hover:bg-muted transition-colors"
                          >
                            <SelectIcon size={20} />
                            <span>Choose from Gallery</span>
                          </button>
                        )}
                        {field.value &&
                          (source === "blanket" ||
                            !firstFrameParam.required) && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 bg-muted size-6 hover:text-muted-foreground"
                              onClick={() => {
                                form.setValue(firstFrameParam.id, null, {
                                  shouldValidate: true,
                                });
                              }}
                            >
                              <X />
                            </Button>
                          )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {lastFrameParam && (
              <FormField
                control={form.control}
                name={lastFrameParam.id}
                render={({ field }) => (
                  <FormItem className="flex flex-col h-full w-full">
                    <DynamicFormLabel
                      label="Last Frame"
                      optional={!lastFrameParam.required}
                      className="text-base text-foreground font-normal shrink-0"
                    />
                    <FormControl>
                      <div className="relative w-full h-full bg-muted">
                        {field.value ? (
                          <img
                            src={field.value}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setGalleryPickerSource(lastFrameParam.id)
                            }
                            className="w-full h-full border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer flex-col gap-y-2 hover:bg-muted transition-colors"
                          >
                            <SelectIcon size={20} />
                            <span>Choose from Gallery</span>
                          </button>
                        )}
                        {field.value && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-2 bg-muted size-6 hover:text-muted-foreground"
                            onClick={() =>
                              form.setValue(lastFrameParam.id, null, {
                                shouldValidate: true,
                              })
                            }
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Negative Prompt (optional) */}
          {negativePromptParam && (
            <DynamicFormField
              param={negativePromptParam}
              form={form}
              type="advanced"
              rules={selectedVideoGenearationModel?.rules}
            />
          )}

          {/* Input Box */}
          <div className="flex flex-col gap-y-4 w-full max-h-[300px] border rounded-2xl bg-background z-10 pb-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
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
                        "relative w-full resize-none border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 min-h-[80px] max-h-[200px] overflow-y-auto align-top "
                      )}
                      placeholder="Describe what you want to see in the video ..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-2 justify-between items-center px-4 flex-1">
              <div className="flex items-center gap-2">
                {initalParams.map((param) => {
                  return (
                    <DynamicFormField
                      key={param.id}
                      param={param}
                      form={form}
                      type="initial"
                      rules={selectedVideoGenearationModel?.rules}
                      sliderSuffix={param.id === "duration" ? "s" : undefined}
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
                              rules={selectedVideoGenearationModel?.rules}
                            />
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div>
                <TokenGenerateButton
                  onClick={() => form.handleSubmit(onSubmit)()}
                  tokens={credits}
                  loading={form.formState.isSubmitting}
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                  isCalculatingTokens={isCalculatingCredits}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
      <MediaLibraryDialog
        onFullMediaItemSelected={async (item) => {
          if (galleryPickerSource) {
            form.setValue(galleryPickerSource, item.asset_url, {
              shouldValidate: true,
            });
            if (
              source === "blanket" &&
              firstFrameParam &&
              galleryPickerSource === firstFrameParam.id
            ) {
              setCurrentItem(item);
            }
          }
          setGalleryPickerSource(null);
        }}
        open={!!galleryPickerSource}
        onOpenChange={(o) => {
          if (!o) {
            setGalleryPickerSource(null);
          }
        }}
        filters={{
          brands: [selectedBrandId!],
          campaigns: [],
          product_categories: [],
          has_product: undefined,
          has_people: undefined,
          has_lifestyle_context: undefined,
          asset_types: ["image"],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          is_favourite: undefined,
          is_archived: undefined,
          moodboards: [],
        }}
        brandId={selectedBrandId!}
        isMultiSelect={false}
        maxSelectionCount={1}
      />
    </Form>
  );
};

export default VideoGenerationInput;
