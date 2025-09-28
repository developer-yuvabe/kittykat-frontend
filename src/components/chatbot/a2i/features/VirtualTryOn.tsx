import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/custom-icon";
import { Form } from "@/components/ui/form";
import { useA2iForm } from "@/hooks/useA2iForm";
import useModelPricing from "@/hooks/useModelPricing";
import { cn, PlatformApiError } from "@/lib/utils";
import { createVtonImage } from "@/services/api/vton.service";
import { useBrandStore } from "@/store/brand.store";
import { useCreditsStore } from "@/store/credits.store";
import { useModelsStore } from "@/store/models.store";
import { BrainIcon, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ModelSelector from "../ModelSelector";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useRouter } from "next/navigation";

type VirtualTryOnProps = {
  modelImage?: string;
};

const VirtualTryOn = ({ modelImage }: VirtualTryOnProps) => {
  const router = useRouter();
  const { closeConceptVisual, source } = useConceptVisualStore();
  const { selectedBrandId, selectedCampaignId: campaignId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { selectedVtonModel, setSelectedVtonModel } = useModelsStore();
  const form = useA2iForm({
    formKey: "vtonForm",
    selectedModel: selectedVtonModel,
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
      closeConceptVisual();

      if (source === "blanket") {
        router.push("/?scrollTo=a2i");
      }
    } catch (error) {
      console.error("VTON Generation Error:", error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate V-TON image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const productImage = productImageParam
    ? form.watch(productImageParam?.id)
    : null;

  useEffect(() => {
    if (modelImage) {
      form.setValue("model_image", modelImage);
    }
  }, [modelImage, form]);

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
                  !form.formState.isValid ||
                  !productImage ||
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
          filters={{
            brands: [selectedBrandId!],
            campaigns: [],
            product_categories: [],
            asset_types: ["image"],
            asset_sources: [],
            media_format: [],
            aspect_ratio: [],
            workflow_status: [],
            moodboards: [],
          }}
          brandId={selectedBrandId!}
          campaignId={campaignId ?? undefined}
        />
      </form>
    </Form>
  );
};

export default VirtualTryOn;
