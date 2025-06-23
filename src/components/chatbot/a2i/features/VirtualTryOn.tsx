import { Button } from "@/components/ui/button";
import { UploadIcon } from "@/components/ui/custom-icon";
import { BrainIcon, X } from "lucide-react";
import React, { useState } from "react";
import { MediaLibraryDialog } from "../MediaLibraryDialog";
import { cn, delay } from "@/lib/utils";
import { createVtonImage } from "@/services/api/vton.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";

type VirtualTryOnProps = {
  productImage: string;
  closeDialog: () => void;
};

const VirtualTryOn = ({ productImage, closeDialog }: VirtualTryOnProps) => {
  const { selectedBrandId } = useBrandStore();
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loading, setLoading] = useState(false);

  const handelVtonGeneration = async () => {
    if (!garmentImage) {
      return;
    }
    setLoading(true);
    try {
      createVtonImage(selectedBrandId!, productImage, garmentImage);

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
          <div className="absolute inset-0">
            <img
              src={garmentImage}
              alt="Garment"
              className="object-contain w-full h-full"
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
              Remove garment
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
          setGarmentImage(mediaItem);
          setShowMediaLibrary(false);
        }}
      />
    </div>
  );
};

export default VirtualTryOn;
