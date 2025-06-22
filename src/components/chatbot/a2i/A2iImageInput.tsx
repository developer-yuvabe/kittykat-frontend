import { Button } from "@/components/ui/button";
import { SendIcon } from "@/components/ui/custom-icon";
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
import { useImageGenForm } from "@/hooks/useImageGenForm";
import { delay } from "@/lib/utils";
import { generateImage } from "@/services/api/a2i.service";
import { deleteFile, uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useA2iStore } from "@/store/a2i.store";
import { useBrandStore } from "@/store/brand.store";
import { Images, Loader2, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { z, ZodTypeAny } from "zod";
import { DynamicFormField } from "./DynamicFormField";
import { FileParameter } from "@/types/a2i-media.types";

const A2iImageInput = () => {
  const { selectedBrandId } = useBrandStore();
  const { selectedModel } = useA2iStore();
  const form = useImageGenForm();

  // Reference to the file input element
  const refernceImagesModelInfo = useMemo(
    () =>
      selectedModel.parameters.find(
        (param) => param.name === "Reference Image(s)"
      )! as FileParameter,
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
                file
              );

              setImageBlocks((prev) => {
                const updated = [...prev];
                updated[blockIndex] = {
                  ...updated[blockIndex],
                  url: uploadedUrl,
                };
                return updated;
              });

              const formName = refernceImagesModelInfo.formName;

              const value =
                refernceImagesModelInfo.maxImages > 1
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
    [refernceImagesModelInfo.formName]
  );

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: refernceImagesModelInfo.maxImages > 1,
    accept: Object.fromEntries(
      refernceImagesModelInfo.accept.map((type) => [type, []])
    ),
    preventDropOnDocument: true,
    disabled: isUploading,
    maxFiles: refernceImagesModelInfo.maxImages,
    maxSize: refernceImagesModelInfo.maxSize,
  });

  function removeReferenceImage(urlToRemove: string) {
    const formName = refernceImagesModelInfo.formName;
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
    generateImage(selectedBrandId!, data);

    await delay(3000);

    form.reset();
    setImageBlocks([]);
  };

  useEffect(() => {
    for (const block of imageBlocks) {
      if (block.url) {
        deleteFile(block.url);
      }
    }

    setImageBlocks([]);
  }, [selectedModel.id]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col-reverse items-stretch w-full max-w-2xl mx-auto border resize-none rounded-2xl sticky bottom-8 h-max max-h-60 bg-background scrollbar overflow-hidden shadow-2xl"
      >
        <div className="flex gap-2 justify-between items-center px-4 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <div>
              <input {...getInputProps()} ref={inputFileRef} />
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => inputFileRef.current?.click()}
              >
                <Images />
              </Button>
            </div>

            {selectedModel.parameters.map((param) => {
              return (
                <DynamicFormField
                  key={param.formName}
                  param={param}
                  form={form}
                  type="initial"
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
                  {selectedModel.advancedParameters.map((advParam) => {
                    return (
                      <DynamicFormField
                        key={advParam.formName}
                        param={advParam}
                        form={form}
                        type="advanced"
                      />
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            size={"icon"}
            disabled={
              !form.formState.isValid ||
              form.formState.isSubmitting ||
              isUploading
            }
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
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
                  className="w-full resize-none border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 py-2 pt-4 h-max min-h-0"
                  placeholder="Describe what you want to see ..."
                />
              </FormControl>
            </FormItem>
          )}
        />
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
      </form>
    </Form>
  );
};

export default A2iImageInput;
