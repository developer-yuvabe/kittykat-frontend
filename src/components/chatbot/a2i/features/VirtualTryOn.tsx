import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/custom-icon";
import { BrainIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn, delay } from "@/lib/utils";
import { createVtonImage } from "@/services/api/vton.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";

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
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loading, setLoading] = useState(false);
  console.log("render");
  console.log("vton", productImage);

  useEffect(() => {
    console.log("viton", garmentImage);
  }, [garmentImage]);

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
      );

      await delay(2000);
      closeDialog();
    } catch {
      toast.error("Failed to generate VTON image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-1">
      <div
        className={cn(
          "border border-dashed bg-muted cursor-pointer rounded-xl flex-1 flex items-center justify-center relative overflow-hidden",
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
              className="object-contain w-[70%] h-[400px] lg:h-[450px] 2xl:h-[600px]"
              onLoad={() => console.log("Garment image loaded")}
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

      <Button
        disabled={!garmentImage || loading}
        loading={loading}
        onClick={handelVtonGeneration}
        className="w-full text-lg h-12 flex-1"
      >
        <BrainIcon />
        A2i Showboard Generation
      </Button>

      <MediaLibraryDialog
        open={showMediaLibrary}
        onOpenChange={(open) => {
          if (!open) {
            setShowMediaLibrary(false);
          }
        }}
        onMediaItemSelected={(mediaItem) => {
          console.log("selected mediaItem:", mediaItem);
          setGarmentImage(mediaItem); // should be a valid URL string
          setShowMediaLibrary(false);
        }}
      />
    </div>
  );
};

export default VirtualTryOn;
