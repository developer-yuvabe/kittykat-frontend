import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/custom-icon";
import { BrainIcon, Loader2, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { cn, PlatformApiError } from "@/lib/utils";
import { createVtonImage } from "@/services/api/vton.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { useUserStore } from "@/store/user.store";
import useModelPricing from "@/hooks/useModelPricing";
import { useModelsStore } from "@/store/models.store";
import { useVtonForm } from "@/hooks/useVtonForm";
import { Form } from "@/components/ui/form";
import ModelSelector from "../ModelSelector";

type VirtualTryOnProps = {
  modelImage: string;
  closeDialog: () => void;
  source: "a2i" | "media-gallery";
  campaignId?: string | null;
};

const VirtualTryOn = ({
  modelImage,
  closeDialog,
  campaignId,
}: VirtualTryOnProps) => {
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useUserStore();
  const { selectedVtonModel, setSelectedVtonModel } = useModelsStore();
  const form = useVtonForm({
    dynamicDefualtValues: {
      model_image: modelImage,
    },
  });
  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedVtonModel,
  });
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loading, setLoading] = useState(false);

  const productImageParam = useMemo(() => {
    return selectedVtonModel?.parameters?.find(
      (param) => param.id === "product_image"
    );
  }, [selectedVtonModel]);

  const onSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await createVtonImage(selectedBrandId!, campaignId || null, data);
      closeDialog();
    } catch (error) {
      console.error("VTON Generation Error:", error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate VTON image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const productImage = productImageParam
    ? form.watch(productImageParam?.id)
    : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 min-h-full flex flex-col">
            <ModelSelector
              selectedModel={selectedVtonModel}
              onModelChange={(m) => {
                setSelectedVtonModel(m);
              }}
              typeFilter="vton"
            />
            <div
              className={cn(
                "border border-dashed bg-muted cursor-pointer rounded-xl flex items-center justify-center relative overflow-hidden min-h-[300px] flex-1",
                {
                  "border-double": !!productImage,
                }
              )}
              onClick={() => {
                if (productImageParam) {
                  setShowMediaLibrary(true);
                }
              }}
            >
              {productImage ? (
                <div className="flex items-center justify-center">
                  <img
                    src={productImage}
                    alt="Garment"
                    className="object-contain w-[70%] max-h-[300px] lg:max-h-[350px] 2xl:max-h-[450px]"
                  />
                  <Button
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      form.setValue("product_image", null);
                    }}
                    className="bg-destructive/10 text-destructive border-destructive border border-dashed hover:bg-destructive/15 absolute top-2 right-2 z-[1000]"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon className="size-8" />
                  <p>Upload Garment</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              <Button
                className="w-full"
                disabled={
                  form.formState.isSubmitting ||
                  // !form.formState.isValid ||
                  isCalculatingCredits
                }
                loading={form.formState.isSubmitting}
              >
                <BrainIcon />
                Concept Visual Generation
                <p>
                  {isCalculatingCredits ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    `(${credits} credits)`
                  )}
                </p>
              </Button>
            </div>
          </div>
        </div>

        <MediaLibraryDialog
          open={showMediaLibrary}
          onOpenChange={(open) => {
            if (!open) {
              setShowMediaLibrary(false);
            }
          }}
          onMediaItemSelected={(mediaItem) => {
            if (productImageParam) {
              form.setValue(productImageParam.id, mediaItem);
            }

            setShowMediaLibrary(false);
          }}
        />
      </form>
    </Form>
  );
};

export default VirtualTryOn;
