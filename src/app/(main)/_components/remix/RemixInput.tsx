import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { remixImageSchema } from "@/schema/remix.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Loader2,
  LucideIcon,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Tally1,
  Tally2,
  Tally4,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { AppConfig } from "@/config/app.config";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";

const IMAGE_SIZE = {
  "1024x1024": {
    label: "1:1",
    icon: Square,
  },
  "1024x1536": {
    label: "2:3",
    icon: RectangleVertical,
  },
  "1536x1024": {
    label: "3:2",
    icon: RectangleHorizontal,
  },
};

const IMAGE_VARIATIONS: Record<number, { label: string; icon: LucideIcon }> = {
  1: {
    label: "1 image",
    icon: Tally1,
  },
  2: {
    label: "2 images",
    icon: Tally2,
  },
  4: {
    label: "4 images",
    icon: Tally4,
  },
};

const RemixInput = ({
  remixUrl,
  handleSubmit,
  remixSize,
}: {
  remixUrl: string;
  remixSize: string;
  handleSubmit: (data: z.infer<typeof remixImageSchema>) => Promise<void>;
}) => {
  const inputFileRef = React.useRef<HTMLInputElement | null>(null);
  const form = useForm<z.infer<typeof remixImageSchema>>({
    resolver: zodResolver(remixImageSchema),
    defaultValues: {
      size: Object.keys(IMAGE_SIZE).includes(remixSize)
        ? (remixSize as keyof typeof IMAGE_SIZE)
        : "1024x1024",
      prompt: "",
      n: 1,
      base_image: remixUrl,
      reference_images: [],
    },
  });
  const [isUploading, setIsUploading] = React.useState(false);
  const [imageBlocks, setImageBlocks] = React.useState<
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
            ...form.getValues("reference_images"),
            uploadedUrl,
          ]);
        } catch {
          console.error("Upload failed for", file.name);
        }
      };

      reader.readAsDataURL(file);
    });

    setIsUploading(false);
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
    const updatedImages = currentImages.filter((url) => url !== urlToRemove);
    form.setValue("reference_images", updatedImages);

    // Remove from imageBlocks
    setImageBlocks((prev) => prev.filter((block) => block.url !== urlToRemove));
  }

  const onSubmit = async (data: z.infer<typeof remixImageSchema>) => {
    await handleSubmit(data);
  };

  return (
    <div className="bg-background rounded-2xl border shadow-xl py-6 px-4 max-w-4xl mx-auto w-[90%] h-max">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {imageBlocks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageBlocks.map((block, index) => (
                  <div
                    key={block.previewUrl}
                    className="relative mb-2 w-16 h-16 rounded-lg overflow-hidden"
                  >
                    <img
                      src={block.previewUrl}
                      alt={`Uploaded preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {!!block.url && (
                      <button
                        onClick={() => removeReferenceImage(block.url!)}
                        className="p-1  absolute top-1 right-1 bg-destructive rounded-full text-white hover:bg-destructive"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    )}
                    {!block.url && (
                      <div className="absolute top-0 right-0 bg-black/30 text-white text-xs  px-1 flex items-center justify-center w-full h-full">
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
                      className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none min-h-10 h-max max-h-40 scrollbar mb-2"
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
                <input {...getInputProps()} ref={inputFileRef} />
                <Button
                  variant="ghost"
                  size="icon"
                  className=""
                  type="button"
                  onClick={() => inputFileRef.current?.click()}
                >
                  <Plus />
                </Button>

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => {
                    const ICON = IMAGE_SIZE[field.value]?.icon;

                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-xl w-max"
                          >
                            {<ICON className="mr-2 h-4 w-4" />}

                            {IMAGE_SIZE[field.value].label}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 rounded-xl px-2"
                          align="start"
                        >
                          <FormLabel className="mb-2">Aspect Ratio</FormLabel>
                          {Object.entries(IMAGE_SIZE).map(
                            ([value, { label, icon: Icon }]) => (
                              <FormControl key={value}>
                                <FormItem
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    "flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted",
                                    {
                                      "bg-muted": field.value === value,
                                    }
                                  )}
                                >
                                  <FormLabel className="font-normal">
                                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                                    {label}
                                  </FormLabel>
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border",
                                      {
                                        "border-4 border-foreground":
                                          field.value === value,
                                      }
                                    )}
                                  ></div>
                                </FormItem>
                              </FormControl>
                            )
                          )}
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="n"
                  render={({ field }) => {
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-xl w-max"
                          >
                            {IMAGE_VARIATIONS[field.value].label}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 rounded-xl px-2"
                          align="start"
                        >
                          <FormLabel className="mb-2">Aspect Ratio</FormLabel>
                          {Object.entries(IMAGE_VARIATIONS).map(
                            ([value, { label, icon: Icon }]) => (
                              <FormControl key={value}>
                                <FormItem
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    "flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted",
                                    {
                                      "bg-muted": field.value === Number(value),
                                    }
                                  )}
                                >
                                  <FormLabel className="font-normal">
                                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                                    {label}
                                  </FormLabel>
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border",
                                      {
                                        "border-4 border-foreground":
                                          field.value === Number(value),
                                      }
                                    )}
                                  ></div>
                                </FormItem>
                              </FormControl>
                            )
                          )}
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </div>
              <Button
                disabled={
                  form.formState.isSubmitting ||
                  !form.formState.isValid ||
                  isUploading
                }
                loading={form.formState.isSubmitting}
              >
                Remix
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RemixInput;
