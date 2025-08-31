import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import useModelPricing from "@/hooks/useModelPricing";
import { useVideoGenForm } from "@/hooks/useVideoGenForm";
import { PlatformApiError } from "@/lib/utils";
import { videoGenerationSchema } from "@/schema/video-gen.schema";
import { videoGenerationService } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { useModelsStore } from "@/store/models.store";
import { useUserStore } from "@/store/user.store";
import { BrainIcon, Loader2 } from "lucide-react";
import { z } from "zod";
import { DynamicFormField } from "../DynamicFormField";
import VideoGenerationLoader from "../VideoGenerationLoader";
import VideoGenerationModelSelector from "../VideoGenerationModelSelector";

type VideoGenerationOnProps = {
  baseImage: string;
  closeDialog: () => void;
  campaignId?: string | null;
};

const VideoGeneration = ({
  baseImage,
  closeDialog,
  campaignId,
}: VideoGenerationOnProps) => {
  const { isModelsFetched, selectedVideoGenearationModel } = useModelsStore();

  if (!isModelsFetched && !selectedVideoGenearationModel) {
    return <VideoGenerationLoader />;
  }

  return (
    <VideoGenerationControls
      baseImage={baseImage}
      closeDialog={closeDialog}
      campaignId={campaignId}
    />
  );
};

const VideoGenerationControls = ({
  baseImage,
  closeDialog,
  campaignId,
}: VideoGenerationOnProps) => {
  const { selectedVideoGenearationModel } = useModelsStore();
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useUserStore();
  const form = useVideoGenForm({
    dynamicDefualtValues: { start_image: baseImage, first_frame: baseImage },
  });
  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedVideoGenearationModel,
  });

  const onSubmit = async (data: z.infer<typeof videoGenerationSchema>) => {
    try {
      if (!selectedBrandId) {
        throw new Error("Brand ID is missing.");
      }
      await videoGenerationService(
        selectedBrandId,
        data,
        campaignId ?? undefined
      );
    } catch (err) {
      console.error("Failed to generate video:", err);
      if (err instanceof PlatformApiError && err.statusCode == 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }
    } finally {
      form.setValue("prompt", "");
      closeDialog();
    }
  };

  return (
    <div className="space-y-6">
      <VideoGenerationModelSelector />

      <div className="w-full flex flex-col lg:flex-row gap-6">
        <div className="w-full flex flex-col gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {selectedVideoGenearationModel?.parameters
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

              <Button
                type="submit"
                className="w-full bg-primary text-white text-md h-12 "
                disabled={
                  form.formState.isSubmitting ||
                  !form.formState.isValid ||
                  isCalculatingCredits
                }
                loading={form.formState.isSubmitting}
              >
                <BrainIcon />
                Concept Visual Generation
                {isCalculatingCredits ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <span className="text-sm italic">({credits} credits)</span>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
