import React, { useState, useCallback, useRef } from "react";
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
import { BrainIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Schema for form validation
const imageUpscaleSchema = z.object({
  image: z.string().min(1, "Image is required"),
  model: z.string(),
  preset: z.string(),
  scale_factor: z.string(),
  optimized_for: z.string(),
  creativity: z.number().min(-3).max(3),
  hdr: z.number().min(0).max(3),
  resemblance: z.number().min(0).max(3),
  fractality: z.number().min(0).max(3),
  engine: z.string(),
  prompt: z.string().optional(),
});

type ImageUpscaleFormData = z.infer<typeof imageUpscaleSchema>;

type ImageUpscalerProps = {
  closeDialog: () => void;
  brandId?: string;
  source: "a2i" | "media-gallery";
  initialImage?: string;
};

// Mock API functions - replace with actual implementations
const upscaleImageService = async (
  brandId: string,
  data: ImageUpscaleFormData,
  fromGallery: boolean = false
): Promise<any> => {
  // Mock implementation - replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 2000);
  });
};

const ImageUpscaler: React.FC<ImageUpscalerProps> = ({
  closeDialog,
  brandId,
  source,
  initialImage,
}) => {
  const form = useForm<ImageUpscaleFormData>({
    resolver: zodResolver(imageUpscaleSchema),
    defaultValues: {
      image: initialImage || "",
      model: "Magnific",
      preset: "Subtle",
      scale_factor: "2x",
      optimized_for: "Standard Ultra",
      creativity: -3,
      hdr: 0,
      resemblance: 3,
      fractality: 0,
      engine: "Automatic",
      prompt: "",
    },
  });

  const onSubmit = async (data: ImageUpscaleFormData) => {
    try {
      await upscaleImageService(
        brandId || "default-brand",
        data,
        source === "media-gallery"
      );

      closeDialog();
    } catch (error) {
      console.error("Upscaling failed:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 min-h-full flex flex-col">
          {/* Form Section */}
          <div className="flex-shrink-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presets</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Subtle">Subtle</SelectItem>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Enhanced">Enhanced</SelectItem>
                            <SelectItem value="Creative">Creative</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Scale Factor & Optimized For */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scale_factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scale factor</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2x">2x</SelectItem>
                            <SelectItem value="4x">4x</SelectItem>
                            <SelectItem value="8x">8x</SelectItem>
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
                        <FormLabel>Optimized for</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Standard Ultra">
                              Standard Ultra
                            </SelectItem>
                            <SelectItem value="Photography">
                              Photography
                            </SelectItem>
                            <SelectItem value="Art & Illustration">
                              Art & Illustration
                            </SelectItem>
                            <SelectItem value="Graphics & Logo">
                              Graphics & Logo
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Creativity & HDR */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="creativity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creativity</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              min={-3}
                              max={3}
                              step={1}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="flex-1"
                            />
                            <div className="text-center text-sm text-muted-foreground">
                              {field.value}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hdr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HDR</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              min={0}
                              max={3}
                              step={1}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="flex-1"
                            />
                            <div className="text-center text-sm text-muted-foreground">
                              {field.value}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Resemblance & Fractality */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="resemblance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resemblance</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              min={0}
                              max={3}
                              step={1}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="flex-1"
                            />
                            <div className="text-center text-sm text-muted-foreground">
                              {field.value}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fractality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fractality</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              min={0}
                              max={3}
                              step={1}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                              className="flex-1"
                            />
                            <div className="text-center text-sm text-muted-foreground">
                              {field.value}
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Engine */}
                <FormField
                  control={form.control}
                  name="engine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Engine</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Automatic">Automatic</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Prompt */}
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your image for better results"
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full text-lg h-12"
                  disabled={form.formState.isSubmitting || !form.watch("image")}
                >
                  <BrainIcon className="mr-2 h-5 w-5" />
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Image Upscale"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpscaler;
