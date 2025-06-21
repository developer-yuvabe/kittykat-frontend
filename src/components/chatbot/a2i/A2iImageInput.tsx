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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AppConfig } from "@/config/app.config";
import { useImageGenForm } from "@/hooks/useImageGenForm";
import { gptImage1Schema } from "@/schema/image-gen.schema";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { Settings2, Ruler, Loader2, X, Images } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import GptImag1AdvanceParameters from "./GptImage1AdvanceParameters";
import { useBrandStore } from "@/store/brand.store";
import { generateImage } from "@/services/api/a2i.service";
import { delay } from "@/lib/utils";

const sizeOptions = [
  { value: "1024x1024", label: "1:1" },
  { value: "1536x1024", label: "3:2" },
  { value: "1024x1536", label: "2:3" },
];

const outputFormat = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WEBP" },
];

const A2iImageInput = () => {
  const { selectedBrandId } = useBrandStore();
  const form = useImageGenForm();
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageBlocks, setImageBlocks] = useState<
    {
      previewUrl: string;
      url: string | null;
    }[]
  >([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const previewUrl = reader.result as string;

        let blockIndex = -1;

        // Insert preview + capture index
        setImageBlocks((prev) => {
          blockIndex = prev.length;
          return [...prev, { previewUrl, url: null }];
        });

        try {
          // Upload the file
          const uploadedUrl = await uploadFileAndReturnUrl(
            file.name,
            file.type,
            "brands",
            file
          );

          //  Update just this one image block
          setImageBlocks((prev) => {
            const updated = [...prev];
            updated[blockIndex] = {
              ...updated[blockIndex],
              url: uploadedUrl,
            };
            return updated;
          });

          form.setValue("reference_images", [
            ...(form.getValues("reference_images") || []),
            uploadedUrl,
          ]);
        } catch {
          console.error("Upload failed for", file.name);
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const { getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": [],
    },
    disabled: isUploading,
    maxFiles: 10,
    maxSize: AppConfig.MAX_FILE_SIZE,
  });

  function removeReferenceImage(urlToRemove: string) {
    const currentImages = form.getValues("reference_images");
    if (!currentImages) return;
    const updatedImages = currentImages.filter((url) => url !== urlToRemove);
    form.setValue("reference_images", updatedImages);

    // Remove from imageBlocks
    setImageBlocks((prev) => prev.filter((block) => block.url !== urlToRemove));
  }

  const onSubmit = async (data: z.infer<typeof gptImage1Schema>) => {
    generateImage(selectedBrandId!, data);

    await delay(3000);

    form.reset();
    setImageBlocks([]);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col-reverse items-stretch w-full max-w-2xl mx-auto border resize-none rounded-2xl sticky bottom-8 h-max max-h-60 bg-background scrollbar overflow-hidden"
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

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disableDropdown className="!gap-0">
                        {(() => {
                          const selected = sizeOptions.find(
                            (opt) => opt.value === field.value
                          );
                          return selected ? (
                            <div className="flex items-center gap-2 w-full">
                              <Ruler className="h-4 w-4" />
                              {selected.label}
                            </div>
                          ) : null;
                        })()}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-44">
                      {sizeOptions.map(({ value, label }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                        >
                          <FormLabel className="font-normal">{label}</FormLabel>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="n"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="!gap-0 !px-2 !py-1"
                      >
                        {field.value}x
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="top"
                      className="space-y-2 w-64"
                    >
                      <FormLabel className="text-sm">
                        Number of images
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          min={1}
                          max={10}
                          step={1}
                        />
                      </FormControl>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="output_format"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("background", "auto");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disableDropdown className="!gap-0">
                        {(() => {
                          const selected = outputFormat.find(
                            (opt) => opt.value === field.value
                          );
                          return selected ? (
                            <div className="flex items-center gap-2 w-full">
                              {selected.label}
                            </div>
                          ) : null;
                        })()}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-44">
                      {outputFormat.map(({ value, label }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                        >
                          <FormLabel className="font-normal">{label}</FormLabel>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

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
                <GptImag1AdvanceParameters
                  outputFormat={form.getValues("output_format")}
                />
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
