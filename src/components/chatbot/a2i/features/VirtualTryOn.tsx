import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/custom-icon";
import { BrainIcon, Loader2, X } from "lucide-react";
import React, { useState } from "react";
import { cn, delay, PlatformApiError } from "@/lib/utils";
import {
  createVtonImage,
  estimateVtonCredits,
} from "@/services/api/vton.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/store/user.store";

type VirtualTryOnProps = {
  productImage: string;
  closeDialog: () => void;
  brandId?: string;
};

const VirtualTryOn = ({
  productImage,
  closeDialog,
  brandId,
}: VirtualTryOnProps) => {
  const { selectedBrandId } = useBrandStore();
  const { setShowInsufficientCreditsModal } = useUserStore();
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: estimatedCredits, isPending } = useQuery({
    queryKey: ["vton-credits", productImage, garmentImage],
    queryFn: async () => {
      return await estimateVtonCredits(productImage, garmentImage ?? "");
    },
  });

  const handelVtonGeneration = async () => {
    if (!garmentImage) {
      return;
    }
    setLoading(true);
    try {
      createVtonImage(
        (brandId ?? selectedBrandId)!,
        productImage,
        garmentImage
      ).catch((error) => {
        if (error instanceof PlatformApiError && error.statusCode === 403) {
          setShowInsufficientCreditsModal(true);
        }
      });
      await delay(2000);
      closeDialog();
    } catch {
      toast.error("Failed to generate VTON image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 min-h-full flex flex-col">
          <div
            className={cn(
              "border border-dashed bg-muted cursor-pointer rounded-xl flex items-center justify-center relative overflow-hidden min-h-[300px] flex-1",
              {
                "border-double": !!garmentImage,
              }
            )}
            onClick={() => {
              if (!garmentImage) {
                setShowMediaLibrary(true);
              }
            }}
          >
            {garmentImage ? (
              <div className="flex items-center justify-center">
                <img
                  src={garmentImage}
                  alt="Garment"
                  className="object-contain w-[70%] max-h-[300px] lg:max-h-[350px] 2xl:max-h-[450px]"
                  onError={() =>
                    console.error("Failed to load garment image:", garmentImage)
                  }
                />
                <Button
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGarmentImage(null);
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
              disabled={!garmentImage || loading || !estimatedCredits}
              loading={loading}
              onClick={handelVtonGeneration}
              className="w-full text-lg h-12"
            >
              <BrainIcon />
              Concept Visual Generation
              {isPending && <Loader2 className="animate-spin" />}
              {estimatedCredits && (
                <span className="text-sm italic">
                  ({estimatedCredits} credits)
                </span>
              )}
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
          setGarmentImage(mediaItem); // should be a valid URL string
          setShowMediaLibrary(false);
        }}
      />
    </div>
  );
};

export default VirtualTryOn;
