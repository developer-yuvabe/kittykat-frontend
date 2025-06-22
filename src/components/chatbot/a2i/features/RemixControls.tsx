import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppConfig } from "@/config/app.config";
import { canvasToBlob, cn, delay } from "@/lib/utils";
import { remixImageSchema } from "@/schema/remix.schema";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eraser,
  Loader2,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Redo,
  Square,
  Tally1,
  Tally2,
  Tally4,
  Undo,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { BrushIcon } from "@/components/ui/custom-icon";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { remixImageService } from "@/services/api/remix.service";
import { useBrandStore } from "@/store/brand.store";

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

const IMAGE_VARIATIONS = {
  "1": {
    label: "1 image",
    icon: Tally1,
  },
  "2": {
    label: "2 images",
    icon: Tally2,
  },
  "4": {
    label: "4 images",
    icon: Tally4,
  },
};

type RemixControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  image: {
    url: string;
    size: string;
  };
  closeDialog: () => void;
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const RemixControls = ({
  image,
  offScreenCanvasRef,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  closeDialog,
}: RemixControlsProps) => {
  const { selectedBrandId } = useBrandStore();
  const inputFileRef = React.useRef<HTMLInputElement | null>(null);
  const form = useForm<z.infer<typeof remixImageSchema>>({
    resolver: zodResolver(remixImageSchema),
    defaultValues: {
      size: Object.keys(IMAGE_SIZE).includes(image.size)
        ? (image.size as keyof typeof IMAGE_SIZE)
        : "1024x1024",
      prompt: "",
      n: 1,
      base_image: image.url,
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
    disabled: isUploading || 10 - imageBlocks.length <= 0,
    maxFiles: 10 - imageBlocks.length,
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
    const offScreenCanvas = offScreenCanvasRef.current;
    if (!offScreenCanvas) return;

    try {
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

      // Download the mask image
      // const downloadLink = document.createElement("a");
      // downloadLink.href = URL.createObjectURL(file);
      // downloadLink.download = "mask-image.png";
      // document.body.appendChild(downloadLink);
      // downloadLink.click();
      // document.body.removeChild(downloadLink);

      const maskUrl = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "remix",
        file
      );

      remixImageService(selectedBrandId!, data, maskUrl);

      await delay(2000);

      closeDialog();
    } catch (err) {
      console.error(err);
      toast.error("Image remix failed. Please try again later.");
    }
  };

  return (
    <div className="w-full flex flex-col gap-y-6 justify-center items-center">
      <div className="flex gap-x-4 w-full">
        <div className="flex gap-6 items-center border p-4 rounded-md flex-1">
          <BrushIcon className="text-primary" />
          <Slider disabled value={[60]} />
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
      <div className="bg-background rounded-2xl border shadow-xl py-6 px-4 mx-auto w-full h-max">
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
                        className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none min-h-10 h-max max-h-60 scrollbar mb-2"
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
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger disableDropdown className="!gap-0">
                              {IMAGE_SIZE[field.value] ? (
                                <div className="w-full">
                                  {(() => {
                                    const Icon = IMAGE_SIZE[field.value].icon;
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {IMAGE_SIZE[field.value].label}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : null}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-44">
                            {Object.entries(IMAGE_SIZE).map(
                              ([value, { label, icon: Icon }]) => (
                                <FormControl key={value}>
                                  <SelectItem
                                    disabledAcknowledge
                                    value={value}
                                    className={cn(
                                      "flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                                    )}
                                  >
                                    <FormLabel className="font-normal">
                                      {Icon && (
                                        <Icon className="mr-2 h-4 w-4" />
                                      )}
                                      {label}
                                    </FormLabel>
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full border absolute right-2 top-1/2 -translate-y-1/2",
                                        {
                                          "border-4 border-foreground":
                                            field.value === value,
                                        }
                                      )}
                                    />
                                  </SelectItem>
                                </FormControl>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="n"
                    render={({ field }) => {
                      const value =
                        field.value.toString() as keyof typeof IMAGE_VARIATIONS;

                      return (
                        <FormItem>
                          <Select
                            onValueChange={(val) => field.onChange(Number(val))}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger disableDropdown className="!gap-0">
                                {IMAGE_VARIATIONS[value] ? (
                                  <div className="w-full">
                                    {(() => {
                                      return (
                                        <div className="flex items-center gap-2">
                                          {IMAGE_VARIATIONS[value].label}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : null}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="w-44">
                              {Object.entries(IMAGE_VARIATIONS).map(
                                ([v, { label, icon: Icon }]) => (
                                  <FormControl key={v}>
                                    <SelectItem
                                      disabledAcknowledge
                                      value={v}
                                      className={cn(
                                        "flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                                      )}
                                    >
                                      <FormLabel className="font-normal">
                                        {Icon && (
                                          <Icon className="mr-2 h-4 w-4" />
                                        )}
                                        {label}
                                      </FormLabel>
                                      <div
                                        className={cn(
                                          "w-4 h-4 rounded-full border absolute right-2 top-1/2 -translate-y-1/2",
                                          {
                                            "border-4 border-foreground":
                                              value === v,
                                          }
                                        )}
                                      />
                                    </SelectItem>
                                  </FormControl>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
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
    </div>
  );
};

export default RemixControls;
