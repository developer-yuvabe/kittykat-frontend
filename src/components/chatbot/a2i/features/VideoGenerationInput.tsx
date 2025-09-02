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
import useModelPricing from "@/hooks/useModelPricing";
import { useVideoGenForm } from "@/hooks/useVideoGenForm";
import { cn, PlatformApiError } from "@/lib/utils";
import { videoGenerationService } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { useModelsStore } from "@/store/models.store";
import { useUserStore } from "@/store/user.store";
import { useVideoGenStore } from "@/store/video-gen.store";
import { FileParam } from "@/types/a2i-media.types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Loader2, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DynamicFormField, DynamicFormLabel } from "../DynamicFormField";
import VideoGenerationModelSelector from "../VideoGenerationModelSelector";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { SelectIcon } from "@/components/ui/custom-icon";

interface VideoGenerationInputProps {
  item: GalleryItemResponse;
  campaignId?: string | null;
}

const VideoGenerationInput = ({
  item,
  campaignId,
}: VideoGenerationInputProps) => {
  const { isModelsFetched, selectedVideoGenearationModel } = useModelsStore();

  return (
    <div className="w-full flex-1 space-y-4">
      {/* Model Chooser */}
      <div className="ml-auto w-max">
        <VideoGenerationModelSelector />
      </div>
      {isModelsFetched && selectedVideoGenearationModel && (
        <VideoGenerationInputControls item={item} campaignId={campaignId} />
      )}
    </div>
  );
};

const VideoGenerationInputControls = ({
  item,
  campaignId,
}: VideoGenerationInputProps) => {
  const [galleryPickerSource, setGalleryPickerSource] = useState<string | null>(
    null
  );
  const { addCurrentSessionGenerationId } = useVideoGenStore();
  const { selectedVideoGenearationModel } = useModelsStore();
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useUserStore();
  const form = useVideoGenForm({
    dynamicDefualtValues: {
      start_image: item.asset_url,
      first_frame: item.asset_url,
    },
  });
  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedVideoGenearationModel,
  });

  const {
    negativePromptParam,
    firstFrameParam,
    lastFrameParam,
    filteredParams,
  } = useMemo(() => {
    const params = selectedVideoGenearationModel?.parameters ?? [];

    let negativePromptParam, firstFrameParam;
    let lastFrameParam: FileParam | undefined;
    const filteredParams: typeof params = [];

    for (const param of params) {
      switch (param.id) {
        case "negative_prompt":
          negativePromptParam = param;
          break;
        case "first_frame":
        case "start_image":
          firstFrameParam = param;
          break;
        case "last_frame":
        case "end_image":
          lastFrameParam = param as FileParam;
          break;
        default:
          filteredParams.push(param);
      }
    }

    return {
      negativePromptParam,
      firstFrameParam,
      lastFrameParam,
      filteredParams,
    };
  }, [selectedVideoGenearationModel]);

  const onSubmit = async (data: Record<string, any>) => {
    try {
      if (!selectedBrandId) {
        throw new Error("Brand ID is missing.");
      }
      const { generation_id } = await videoGenerationService(
        selectedBrandId,
        data,
        campaignId ?? undefined
      );

      addCurrentSessionGenerationId(generation_id);
    } catch (err) {
      console.error("Failed to generate video:", err);
      if (err instanceof PlatformApiError && err.statusCode == 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }
    } finally {
      form.setValue("prompt", "");
    }
  };

  useEffect(() => {
    form.reset();
  }, [item]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-[95%]">
        <div className="flex flex-col gap-y-6 h-full">
          {/* Frames */}
          <div className="flex-1 h-full flex gap-x-2">
            {firstFrameParam && (
              <FormField
                control={form.control}
                name={firstFrameParam.id}
                render={({ field }) => (
                  <FormItem className="h-full w-full">
                    <FormControl>
                      <div className="w-full">
                        <DynamicFormLabel
                          label="First Frame"
                          optional={!firstFrameParam.required}
                          className="text-base text-foreground font-normal"
                        />
                        <div className="relative w-full h-60 bg-muted">
                          {field.value ? (
                            <img
                              src={field.value}
                              className="w-full h-full object-contain"
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
                          {field.value && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute top-2 right-2 bg-muted size-6 hover:text-muted-foreground"
                              onClick={() =>
                                form.resetField(firstFrameParam.id)
                              }
                            >
                              <X />
                            </Button>
                          )}
                        </div>
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
                  <FormItem className="h-full w-full">
                    <FormControl>
                      <div className="w-ful">
                        <DynamicFormLabel
                          label="Last Frame"
                          optional={!lastFrameParam.required}
                          className="text-base text-foreground font-normal"
                        />
                        <div className="relative w-full h-60 bg-muted">
                          {field.value ? (
                            <img
                              src={field.value}
                              className="w-full h-full object-contain"
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
                              onClick={() => form.resetField(lastFrameParam.id)}
                            >
                              <X />
                            </Button>
                          )}
                        </div>
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
          <div className="flex flex-col items-stretch w-full mx-auto border resize-none rounded-2xl sticky bottom-8 h-max bg-background scrollbar overflow-hidden z-10 pb-4">
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
                          "relative w-full resize-none border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-[40px] max-h-[200px] overflow-y-auto align-top pb-4"
                        )}
                        placeholder="Describe what you want to see in the video ..."
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-2 justify-between items-center px-4">
              <div className="flex items-center gap-2">
                {filteredParams
                  ?.filter((param) => param.category === "initial")
                  .map((param) => {
                    return (
                      <DynamicFormField
                        key={param.id}
                        param={param}
                        form={form}
                        type="initial"
                        rules={selectedVideoGenearationModel?.rules}
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
                      {filteredParams
                        ?.filter((param) => param.category === "advanced")
                        .map((param) => {
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
              </div>
              <div>
                <Button
                  disabled={
                    !form.formState.isValid ||
                    form.formState.isSubmitting ||
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
          </div>
        </div>
      </form>
      <MediaLibraryDialog
        onFullMediaItemSelected={async (item) => {
          if (galleryPickerSource)
            form.setValue(galleryPickerSource, item.asset_url);
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
