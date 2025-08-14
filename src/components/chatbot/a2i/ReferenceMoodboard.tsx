import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { galleryService } from "@/services/api/gallery.service";
import { useBrandStore } from "@/store/brand.store";
import {
  MoodboardInformation,
  ThreadA2iImage,
  ThreadDetails,
} from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  RefObject,
  useRef,
} from "react";
import { toast } from "sonner";
import { Photo } from "react-photo-album";
import ManualMoodboardSkeleton from "../moodboards/MoodboardSkeleton";
import { EditIcon } from "@/components/ui/custom-icon";
import { useA2iStore } from "@/store/a2i.store";
import CustomGalleryContainer, {
  SortablePhoto,
} from "@/components/gallery/CustomGalleryContainer";
import { GalleryItemResponse } from "@/types/gallery.types";
import { MIN_IMAGES_REQUIRED } from "@/lib/moodboard.utils";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
  moodboardInformation,
  formRef,
}: ReferenceMoodboardProps) => {
  const { setReferencePrompt } = useA2iStore();
  const [n, setN] = useState<number | "">(prompts?.length || "");
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [loading, setLoading] = useState(false);

  // Add placeholder functionality similar to MoodboardLayout
  const [placeholderItems, setPlaceholderItems] = useState<
    SortablePhoto<Photo>[]
  >([]);

  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard, isPending } = useMutation({
    mutationFn: () =>
      generateA2iShowboard(selectedBrandId!, referenceMoodboardId!, Number(n)),
  });

  const selectedMoodboard = moodboardInformation?.find(
    (mb) => mb.id === referenceMoodboardId
  );

  // Extract gallery item IDs from the moodboard assets
  const galleryItemIds = useMemo(() => {
    return (
      selectedMoodboard?.moodboard_assets?.map(
        (asset) => asset.gallery_item_id
      ) || []
    );
  }, [selectedMoodboard?.moodboard_assets]);

  // Fetch only the required gallery items using bulk API
  const {
    data: bulkGalleryItems = [],
    isLoading: isBulkLoading,
    isFetching: isBulkFetching,
  } = useQuery({
    queryKey: ["gallery-items-bulk", galleryItemIds],
    queryFn: () => galleryService.getGalleryItemsBulk({ ids: galleryItemIds }),
    enabled: galleryItemIds.length > 0,
  });

  // Order gallery items by moodboard position
  const orderedGalleryItems = useMemo(() => {
    if (
      !bulkGalleryItems ||
      !selectedMoodboard?.moodboard_assets ||
      selectedMoodboard.moodboard_assets.length === 0
    ) {
      return [];
    }

    // Create a map of gallery_item_id to position for efficient lookup
    const positionMap = new Map(
      selectedMoodboard.moodboard_assets.map((asset) => [
        asset.gallery_item_id,
        asset.position,
      ])
    );

    // Add position info to gallery items and sort by position
    return bulkGalleryItems
      .map((item) => ({
        ...item,
        position: positionMap.get(item.id) || 0,
      }))
      .sort((a, b) => a.position - b.position);
  }, [bulkGalleryItems, selectedMoodboard?.moodboard_assets]);

  // Load images from ordered gallery items
  const loadImagesWithDimensions = useCallback(async () => {
    if (!orderedGalleryItems || orderedGalleryItems.length === 0) {
      setPhotos([]);
      return;
    }

    setLoading(true);

    try {
      const loaded: SortablePhoto<Photo>[] = orderedGalleryItems.map(
        (item) => ({
          id: item.id,
          src: item.asset_url,
          width: item.dimensions?.width || 300,
          height: item.dimensions?.height || 300,
          alt: `Reference image ${item.id}`,
          liked: item.is_favourite || false,
        })
      );

      setPhotos(loaded);
    } catch (error) {
      console.error("Failed to load reference images:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [orderedGalleryItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setN("");
      return;
    }

    const num = parseInt(val, 10);

    if (!isNaN(num) && num >= 1 && num <= 3) {
      setN(num);
    }
  };

  // Load images when ordered gallery items are available
  useEffect(() => {
    if (orderedGalleryItems.length > 0) {
      const timeoutId = setTimeout(() => {
        loadImagesWithDimensions();
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear photos if no ordered items
      setPhotos([]);
    }
  }, [orderedGalleryItems.length]);

  // Display logic - show gallery if we have photos OR if we need placeholders for grid layout
  const showGallery = useMemo(() => {
    return (
      (photos.length > 0 || placeholderItems.length > 0) &&
      !loading &&
      !isBulkFetching &&
      !isBulkLoading
    );
  }, [
    photos.length,
    placeholderItems.length,
    loading,
    isBulkFetching,
    isBulkLoading,
  ]);

  // Calculate total images for moodboard (actual photos + placeholders needed for minimum grid)
  const totalImagesForMoodboard = Math.max(photos.length, MIN_IMAGES_REQUIRED);

  useEffect(() => {
    if (prompts && prompts.length > 0) {
      setN(prompts.length);
    }
  }, [prompts]);

  const latestMoodboardRef = useRef<MoodboardInformation | null>(null);
  const latestGalleryItemsRef = useRef<GalleryItemResponse[]>([]);

  // Keep track of latest values
  useEffect(() => {
    latestMoodboardRef.current = selectedMoodboard || null;
  }, [selectedMoodboard]);

  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  // Create placeholder items for missing photos when less than minimum required
  useEffect(() => {
    const placeholders: SortablePhoto<Photo>[] = Array.from(
      { length: Math.max(0, MIN_IMAGES_REQUIRED - photos.length) },
      (_, index) => ({
        id: `placeholder-${index}`,
        src: "", // Placeholder image src (empty or a default placeholder image URL)
        width: 300, // Default width
        height: 300, // Default height
        alt: `Placeholder ${index + 1}`,
        liked: false,
        isPlaceholder: true,
        placeholderIndex: photos.length + index,
      })
    );
    setPlaceholderItems(placeholders);
  }, [photos.length, MIN_IMAGES_REQUIRED]);

  return (
    <ContentSection
      title="Reference Moodboard"
      showCopy={false}
      showPin={false}
      context={{
        data: {},
      }}
      content={
        <div className="space-y-8">
          {showGallery && (
            <div className="mx-auto max-w-7xl w-full px-2">
              <CustomGalleryContainer
                photos={photos}
                setPhotos={() => {}}
                noOfImagesForMoodboard={totalImagesForMoodboard}
                setNoOfImagesForMoodboard={() => {}}
                moodboard={selectedMoodboard!}
                placeholderItems={placeholderItems}
                setPlaceholderItems={setPlaceholderItems}
                hasUnsavedChanges={false}
                isPreview
              />
            </div>
          )}

          {!showGallery && photos.length === 0 && (
            <ManualMoodboardSkeleton
              shimmer={isBulkFetching || isBulkLoading}
              showButton={false}
            />
          )}

          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Prompts</h3>
                  <Input
                    type="number"
                    value={n}
                    onChange={handleChange}
                    onPaste={(e) => e.preventDefault()} // Disable paste
                    min={1}
                    max={3}
                    inputMode="numeric"
                    pattern="[0-9]*" // Hint for mobile keyboards
                  />
                </div>
                {referenceMoodboardId && (
                  <Button
                    variant={"outline"}
                    className="text-primary border-primary"
                    disabled={isPending}
                    onClick={() =>
                      generateShowboard(undefined, {
                        onSuccess: () => {
                          toast.success(
                            "Concept Visual prompts generated successfully!"
                          );
                        },
                        onError: () => {
                          toast.error(
                            "Failed to generate concept Visual prompts. Please try again."
                          );
                        },
                      })
                    }
                  >
                    <WandSparkles />
                    {isPending ? "Generating prompts..." : "Generate Prompts"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 auto">
                {prompts.map((prompt) => (
                  <div key={prompt} className="relative">
                    <Textarea
                      value={prompt}
                      readOnly
                      className="min-h-40 max-h-40 scrollbar"
                    />
                    <Button
                      variant="ghost"
                      className="absolute bottom-2 right-2"
                      size="icon"
                      onClick={() => {
                        if (formRef.current) {
                          setReferencePrompt(prompt);
                          formRef.current.scrollIntoView({
                            behavior: "smooth",
                          });
                        }
                      }}
                    >
                      <EditIcon />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export default ReferenceMoodboard;
