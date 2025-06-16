import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  ImageActionsDelete,
  ImageActionsExpand,
  ImageCard,
  ImageCardHeader,
  ImageCardImage,
} from "@/components/ui/image-card";
import { Textarea } from "@/components/ui/textarea";
import { vtonSchema } from "@/schema/vton.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { cn } from "@/lib/utils";
import GarmentSvg from "@/assets/garment.svg";
import ModelSvg from "@/assets/model.svg";
import Image from "next/image";
import { toast } from "sonner";
import { createVtonImage } from "@/services/api/vton.service";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";

const VirtualTryOn = () => {
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const [mediaLibraryOpen, setMediaLibraryOpen] = React.useState<
    null | "model" | "product"
  >(null);
  const form = useForm<z.infer<typeof vtonSchema>>({
    resolver: zodResolver(vtonSchema),
  });

  const onSubmit = async (data: z.infer<typeof vtonSchema>) => {
    try {
      await createVtonImage(user!.id, selectedBrandId!, data);

      form.reset();
    } catch {
      toast.error(
        "An error occurred while processing your virtual try on request. Please try again."
      );
    }
  };

  return (
    <ContentSection
      content={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="w-full space-y-8">
              <div className="flex items-center justify-around gap-4">
                <FormField
                  control={form.control}
                  name="model_image"
                  render={({ field }) => (
                    <FormItem className="w-80">
                      <ImageCard
                        className={cn("w-full h-80", {
                          "border-dashed border-2 border-gray-300":
                            !field.value,
                        })}
                        {...field}
                      >
                        {!field.value ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-4 hover:bg-muted">
                            <FormLabel>Choose your Model Image</FormLabel>
                            <Image
                              alt="Model Icon"
                              src={ModelSvg}
                              height={160}
                            />
                            <Button
                              type="button"
                              onClick={() => setMediaLibraryOpen("model")}
                            >
                              Select Board
                            </Button>
                          </div>
                        ) : (
                          <>
                            <ImageCardHeader>
                              <ImageActionsDelete
                                onDelete={() => {
                                  field.onChange("");
                                  field.onBlur();
                                }}
                              />
                              <ImageActionsExpand />
                            </ImageCardHeader>
                            <ImageCardImage src={field.value} />
                          </>
                        )}
                      </ImageCard>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="product_image"
                  render={({ field }) => (
                    <FormItem className="w-80">
                      <ImageCard
                        className={cn("w-full h-80", {
                          "border-dashed border-2 border-gray-300":
                            !field.value,
                        })}
                        {...field}
                      >
                        {!field.value ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-4 hover:bg-muted">
                            <FormLabel>Choose your Product Image</FormLabel>
                            <Image
                              alt="Garment Icon"
                              src={GarmentSvg}
                              height={160}
                            />
                            <Button
                              type="button"
                              onClick={() => setMediaLibraryOpen("product")}
                            >
                              Select Board
                            </Button>
                          </div>
                        ) : (
                          <>
                            <ImageCardHeader>
                              <ImageActionsDelete
                                onDelete={() => {
                                  field.onChange("");
                                  field.onBlur();
                                }}
                              />
                              <ImageActionsExpand />
                            </ImageCardHeader>
                            <ImageCardImage src={field.value} />
                          </>
                        )}
                      </ImageCard>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="leading-none font-semibold mb-2">
                  Prompt{" "}
                  <span className="text-xs italic font-normal">(optional)</span>
                </div>
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the image..."
                          className="resize-none h-max max-h-40 scrollbar"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <MediaLibraryDialog
                onMediaItemSelected={(url) => {
                  if (mediaLibraryOpen === "model") {
                    form.setValue("model_image", url, {
                      shouldValidate: true,
                    });
                  } else if (mediaLibraryOpen === "product") {
                    form.setValue("product_image", url, {
                      shouldValidate: true,
                    });
                  }
                  setMediaLibraryOpen(null);
                }}
                open={!!mediaLibraryOpen}
                onOpenChange={(o) => {
                  if (!o) {
                    setMediaLibraryOpen(null);
                  }
                }}
              />
              <Button
                type="submit"
                className="ml-auto flex"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                Go to Generator
              </Button>
            </div>
          </form>
        </Form>
      }
      title="Virtual Try-On"
    />
  );
};

export default VirtualTryOn;
