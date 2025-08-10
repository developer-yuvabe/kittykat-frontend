import { GalleryItemResponse } from "@/types/gallery.types";

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
import { HeartIcon, Maximize2, X } from "lucide-react";

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
};

export function CustomGalleryPlaceholderCard<TPhoto extends Photo>({
  photos,
  noOfImagesForMoodboard,
  moodboard,
  onGallerySelection,
  placeHolderIndex,
  setPhotos,
  setNoOfImagesForMoodboard,
}: PlaceholderCardProps<TPhoto>) {
  const { selectedBrandId } = useBrandStore();

  const { getGalleryItems } = useGalleryQuery(
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

  const autoFillPlaceholders = useCallback(() => {
    const availableItems = getGalleryItems().filter(
      (item) => !photos.some((photo) => photo.id === item.id)
    );

    if (availableItems.length === 0) {
      toast.error("No available images to add.");
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
  }, [getGalleryItems, photos]);

  return (
    <div className="relative group w-full h-full bg-neutral-300 flex flex-col items-center justify-center transition-all duration-200">
      {/* Background gradient - lowest z-index */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#A1A8B3FF] via-transparent to-[#A1A8B3FF] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {/* Buttons container - enable pointer events and high z-index */}
        <div className="flex flex-col items-center justify-center gap-0 pointer-events-auto z-50">
          <Button
            size="lg"
            className="rounded-b-none w-28 hover:opacity-90"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              autoFillPlaceholders();
            }}
          >
            <RegenerateIcon size={16} color="white" />
            Autofill
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
      </div>

      {/* Corner icons */}
      <div className="absolute top-2 left-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
        <X
          size={16}
          className="w-5 h-5 cursor-pointer transition-all duration-200 text-white fill-white hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
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
