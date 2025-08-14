import { GalleryItemResponse } from "@/types/gallery.types";
import { AutoFillSuggestedImage } from "@/types/moodboard.types";

import { Photo } from "react-photo-album";
import { useBrandStore } from "@/store/brand.store";
import { MoodboardGallerySelector } from "../chatbot/moodboards/MoodboardGallerySelector";
import { MoodboardInformation } from "@/types/types";
import { SortablePhoto } from "./CustomGalleryContainer";
import { Button } from "../ui/button";
import { RegenerateIcon } from "../ui/custom-icon";
import { useGalleryQuery } from "@/hooks/useGallery";
import { toast } from "sonner";
import { useCallback } from "react";
import { HeartIcon, Loader2, Maximize2, X } from "lucide-react";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";

type PlaceholderCardProps<TPhoto extends Photo> = {
  photos: SortablePhoto<TPhoto>[];
  noOfImagesForMoodboard: number;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeHolderIndex: number
  ) => void;
  placeHolderIndex: number;
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<TPhoto>[]>>;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  isPreview?: boolean;
};

export function CustomGalleryPlaceholderCard<TPhoto extends Photo>({
  photos,
  noOfImagesForMoodboard,
  moodboard,
  onGallerySelection,
  placeHolderIndex,
  setPhotos,
  setNoOfImagesForMoodboard,
  isPreview = false,
}: PlaceholderCardProps<TPhoto>) {
  const { selectedBrandId } = useBrandStore();

  useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    30
  );

  // TanStack Query for autofill suggestions - fetch on mount
  const { data: autoFillSuggestions = [], isLoading: isAutoFillLoading } =
    useMoodboardQuery({
      brandId: selectedBrandId || undefined,
      campaignId: moodboard.campaign_id,
      moodboardId: moodboard.id,
      count: 50,
    });

  const autoFillPlaceholders = useCallback(() => {
    if (isAutoFillLoading) {
      toast.warning("AutoFill suggestions are still loading...");
      return;
    }

    if (!autoFillSuggestions || autoFillSuggestions.length === 0) {
      toast.warning("No suggested images available. Please try again later.");
      return;
    }

    // Filter out images that are already in the moodboard
    let availableItems = autoFillSuggestions.filter(
      (item: AutoFillSuggestedImage) =>
        !photos.some((photo) => photo.id === item.id)
    );

    availableItems = availableItems.sort(
      (a: AutoFillSuggestedImage, b: AutoFillSuggestedImage) => {
        if (a.is_favourite === b.is_favourite) return 0;
        return a.is_favourite ? -1 : 1;
      }
    );

    if (availableItems.length === 0) {
      toast.warning("All suggested images are already in your moodboard.");
      return;
    }

    const placeholderStartIndex = photos.length;

    setPhotos((prevPhotos) => {
      const updatedPhotos = [...prevPhotos];
      const item = availableItems[0]; // just add one

      updatedPhotos[placeholderStartIndex] = {
        id: item.id,
        src: item.asset_url,
        width: item.dimensions?.width || 300,
        height: item.dimensions?.height || 300,
        alt: `Image ${item.id}`,
        liked: item.is_favourite || false,
      } as SortablePhoto<TPhoto>;

      return updatedPhotos;
    });

    toast.success("Added suggested image to your moodboard.");
  }, [isAutoFillLoading, autoFillSuggestions, photos, setPhotos]);

  return (
    <div className="relative group w-full h-full bg-neutral-300 flex flex-col items-center justify-center transition-all duration-200">
      {/* Background gradient - lowest z-index */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#A1A8B3FF] via-transparent to-[#A1A8B3FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {/* Buttons container - enable pointer events and high z-index */}
        {!isPreview && (
          <div className="flex flex-col items-center justify-center gap-0 pointer-events-auto z-50">
            <Button
              size="lg"
              className="rounded-b-none w-28 hover:opacity-90"
              disabled={isAutoFillLoading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                autoFillPlaceholders();
              }}
            >
              {isAutoFillLoading ? (
                <>
                  <span className="mr-2">Autofill</span>
                  <Loader2 className="animate-spin text-white" />
                </>
              ) : (
                <>
                  <RegenerateIcon color="white" />
                  <span>Autofill</span>
                </>
              )}
            </Button>

            <div className="pointer-events-auto z-50">
              <MoodboardGallerySelector
                brandId={selectedBrandId!}
                campaignId={moodboard.campaign_id}
                moodboardId={moodboard.id}
                hasUnsavedChanges={false}
                inSelectionGalleryIds={photos.map((photo) => photo.id)}
                noOfImagesForMoodboard={noOfImagesForMoodboard}
                onGallerySelection={onGallerySelection}
                placeHolderIndex={placeHolderIndex}
              />
            </div>
          </div>
        )}
      </div>

      {/* Corner icons */}
      <div className="absolute top-2 left-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <X
          size={16}
          className="w-5 h-5 cursor-pointer transition-all duration-200 text-white fill-white hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Prevent removal if count would drop below 10
            if (!isPreview && noOfImagesForMoodboard <= 10) {
              toast.warning("Atleast 10 images are required.");
              return;
            }

            setNoOfImagesForMoodboard((prev) => prev - 1);
            setPhotos((prev) => {
              const newPhotos = [...prev];
              newPhotos.splice(placeHolderIndex, 1);
              return newPhotos;
            });
          }}
        />
      </div>

      <div className="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <Maximize2
          size={16}
          className="w-5 h-5 cursor-pointer transition-colors text-white hover:scale-110 active:scale-95"
        />
      </div>

      <div className="absolute bottom-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <HeartIcon
          size={16}
          className="w-5 h-5 cursor-pointer transition-all duration-200 text-white hover:scale-110 active:scale-95"
        />
      </div>
    </div>
  );
}
