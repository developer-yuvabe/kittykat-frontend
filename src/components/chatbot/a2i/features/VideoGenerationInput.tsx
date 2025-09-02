import { GalleryItemResponse } from "@/types/gallery.types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import VideoGenerationModelSelector from "../VideoGenerationModelSelector";
import { useModelsStore } from "@/store/models.store";
import { cn, PlatformApiError } from "@/lib/utils";
import { videoGenerationService } from "@/services/api/video-gen.service";
import useModelPricing from "@/hooks/useModelPricing";
import { useBrandStore } from "@/store/brand.store";
import { useVideoGenForm } from "@/hooks/useVideoGenForm";
import { useUserStore } from "@/store/user.store";
import { DynamicFormField, DynamicFormLabel } from "../DynamicFormField";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2, Upload, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { FileParam } from "@/types/a2i-media.types";
import { deleteFile, uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useVideoGenStore } from "@/store/video-gen.store";

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
  const [isLastFrameUploading, setIsLastFrameUploading] =
    useState<boolean>(false);
  const [lastFrameUploadPreview, setLastFrameUploadPreview] = useState<
    string | null
  >(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const { addCurrentSessionGenerationId, clearCurrentSessionGenerationIds } =
    useVideoGenStore();
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
  }, [selectedVideoGenearationModel, item]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0 && lastFrameParam) {
        toast.warning(
          `Some files were rejected. Please note: Maximum file size is ${
            lastFrameParam.maxFileSizeLimit
          } MB, allowed file types are ${lastFrameParam?.fileTypes.join(", ")}.`
        );
      }

      if (acceptedFiles.length === 0 || !lastFrameParam) return;

      setIsLastFrameUploading(true);

      const uploadPromises = acceptedFiles.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = async () => {
            const previewUrl = reader.result as string;

            setLastFrameUploadPreview(previewUrl);

            try {
              const uploadedUrl = await uploadFileAndReturnUrl(
                file.name,
                file.type,
                "brands",
                file,
                selectedBrandId || null
              );

              form.setValue(lastFrameParam.id, uploadedUrl, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
              setLastFrameUploadPreview(null);
            } catch {
              console.error("Upload failed for", file.name);
            } finally {
              resolve();
            }
          };

          reader.readAsDataURL(file);
        });
      });

      await Promise.allSettled(uploadPromises);
      setIsLastFrameUploading(false);
    },
    [lastFrameParam]
  );

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: Object.fromEntries(
      (lastFrameParam?.fileTypes ?? []).map((type) => [type, []])
    ),
    preventDropOnDocument: true,
    disabled:
      isLastFrameUploading || form.formState.isSubmitting || !lastFrameParam,
    maxFiles: 1,
    maxSize: (lastFrameParam?.maxFileSizeLimit ?? 0) * 1024 * 1024,
  });

  function removeLastFrame(shouldDeleteFromGCS = true) {
    const url = form.getValues(lastFrameParam?.id || "");
    form.setValue(lastFrameParam?.id || "", "", {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // delete the file from GCS
    if (url && shouldDeleteFromGCS) deleteFile(url);
  }

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

      removeLastFrame(false);
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
    removeLastFrame();
    setLastFrameUploadPreview(null);
  }, [item]);

  useEffect(() => {
    return () => {
      clearCurrentSessionGenerationIds();
    };
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-8">
          {/* Frames */}
          <div className="flex gap-4 ">
            {firstFrameParam && (
              <div className="space-y-2 w-60">
                <DynamicFormLabel
                  label="First Frame"
                  optional={!firstFrameParam.required}
                />
                <img
                  src={form.getValues(firstFrameParam.id)}
                  alt="First Frame"
                  className="h-60 w-60 object-contain"
                />
              </div>
            )}
            {lastFrameParam && (
              <div className="space-y-2 w-60">
                <DynamicFormLabel
                  label="Last Frame"
                  optional={!lastFrameParam.required}
                />
                <input {...getInputProps()} ref={inputFileRef} />

                <div
                  onClick={() => {
                    if (
                      inputFileRef.current &&
                      !isLastFrameUploading &&
                      !form.getValues(lastFrameParam.id)
                    ) {
                      inputFileRef.current.click();
                    }
                  }}
                  className={cn(
                    "h-60 w-full flex flex-col items-center justify-center text-sm text-muted-foreground cursor-pointer bg-accent transition-colors  relative",
                    {
                      "border-dashed border gap-y-2": !form.getValues(
                        lastFrameParam.id
                      ),
                    }
                  )}
                >
                  {form.watch(lastFrameParam.id) ? (
                    <>
                      <img
                        src={form.getValues(lastFrameParam.id)}
                        alt="Last Frame"
                        className="h-60 w-60 object-contain"
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLastFrame();
                        }}
                        variant={"ghost"}
                        size={"icon"}
                        className="absolute top-1 right-1 text-white hover:text-black p-0"
                      >
                        <X />
                      </Button>
                    </>
                  ) : lastFrameUploadPreview ? (
                    <>
                      <img
                        src={lastFrameUploadPreview}
                        alt="Last Frame Preview"
                        className="h-60 w-full object-cover"
                      />
                      {isLastFrameUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="animate-spin h-10 w-10 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Upload />
                      <p>Upload last frame</p>
                    </>
                  )}
                </div>
              </div>
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
            <div className="flex gap-2 justify-between items-center px-4">
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
    </Form>
  );
};

export default VideoGenerationInput;
