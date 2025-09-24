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
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import useModelPricing from "@/hooks/useModelPricing";
import { PlatformApiError } from "@/lib/utils";
import { upscaleImage } from "@/services/api/upscale.service";
import { useBrandStore } from "@/store/brand.store";
import { useCreditsStore } from "@/store/credits.store";
import { useModelsStore } from "@/store/models.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ModelSelector from "../ModelSelector";

const upscalerSchema = z.object({
  image_url: z.string().min(1, "Image URL is required"),
  scale_factor: z.enum(["2x", "4x", "8x", "16x"]),
  optimized_for: z.enum([
    "standard",
    "soft_portraits",
    "hard_portraits",
    "art_n_illustration",
    "videogame_assets",
    "nature_n_landscapes",
    "films_n_photography",
    "3d_renders",
    "science_fiction_n_horror",
  ]),
  creativity: z.number().min(-10).max(10),
  hdr: z.number().min(-10).max(10),
  resemblance: z.number().min(-10).max(10),
  fractality: z.number().min(-10).max(10),
  engine: z.enum([
    "automatic",
    "magnific_illusio",
    "magnific_sharpy",
    "magnific_sparkle",
  ]),
  prompt: z.string().optional(),
  campaign_id: z.string().nullable().optional(),
});

type ImageUpscalerProps = {
  closeDialog?: () => void;
  brandId?: string;
  source: "a2i" | "media-gallery";
  initialImage?: string;
  campaignId?: string | null;
  handleDialogChange?: (isOpen: boolean) => void;
};

const ImageUpscaler: React.FC<ImageUpscalerProps> = ({
  closeDialog,
  brandId,
  initialImage,
  campaignId,
  handleDialogChange,
}) => {
  const { selectedUpscaleModel } = useModelsStore();
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { models } = useModelsStore();

  const form = useForm<z.infer<typeof upscalerSchema>>({
    resolver: zodResolver(upscalerSchema),
    defaultValues: {
      image_url: initialImage || "",
      scale_factor: "2x",
      optimized_for: "standard",
      creativity: 0,
      hdr: 0,
      resemblance: 0,
      fractality: 0,
      engine: "automatic",
      prompt: "",
      campaign_id: campaignId || null,
    },
  });
  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: models.find((model) => model.type === "image-upscale") || null,
  });
  useEffect(() => {
    if (initialImage) {
      form.setValue("image_url", initialImage);
    }
  }, [initialImage, form]);

  const onSubmit = async (data: z.infer<typeof upscalerSchema>) => {
    try {
      await upscaleImage(brandId || selectedBrandId!, data);
      closeDialog?.();
      if (handleDialogChange) {
        form.reset();
        handleDialogChange(false);
      }
    } catch (error) {
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
      } else {
        toast.error("Failed to upscale image. Please try again.");
      }
    }
  };

  return (
    <div className="p-4 space-y-6 h-full">
      <ModelSelector
        typeFilter="image-upscale"
        onModelChange={() => form.reset()}
        selectedModel={selectedUpscaleModel}
      />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 flex-1 h-full"
        >
          {/* Quick Settings */}
          <div className="flex flex-wrap gap-2">
            <FormField
              control={form.control}
              name="scale_factor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Scale Factor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-max">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2x">2x Scale</SelectItem>
                      <SelectItem value="4x">4x Scale</SelectItem>
                      <SelectItem value="8x">8x Scale</SelectItem>
                      <SelectItem value="16x">16x Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="optimized_for"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Optimized for</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-max">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="soft_portraits">
                        Soft Portraits
                      </SelectItem>
                      <SelectItem value="hard_portraits">
                        Hard Portraits
                      </SelectItem>
                      <SelectItem value="art_n_illustration">
                        Art & Illustration
                      </SelectItem>
                      <SelectItem value="videogame_assets">
                        Video Game Assets
                      </SelectItem>
                      <SelectItem value="nature_n_landscapes">
                        Nature & Landscapes
                      </SelectItem>
                      <SelectItem value="films_n_photography">
                        Films & Photography
                      </SelectItem>
                      <SelectItem value="3d_renders">3D Renders</SelectItem>
                      <SelectItem value="science_fiction_n_horror">
                        Sci-Fi & Horror
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Advanced Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Advanced Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creativity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Creativity</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hdr"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">HDR</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resemblance"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Resemblance</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fractality"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Fractality</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="engine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Engine</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="magnific_illusio">
                        Magnific Illusio
                      </SelectItem>
                      <SelectItem value="magnific_sharpy">
                        Magnific Sharpy
                      </SelectItem>
                      <SelectItem value="magnific_sparkle">
                        Magnific Sparkle
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Prompt */}
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Prompt (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Additional prompt to guide the upscaling process..."
                    className="resize-none"
                    rows={3}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Submit Button - No credits shown */}
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || isCalculatingCredits}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Upscale Image"
            )}
            <p>
              {isCalculatingCredits ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                `(${credits} credits)`
              )}
            </p>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ImageUpscaler;
