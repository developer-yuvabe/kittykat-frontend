import CustomGridGallery from "@/components/gallery/CustomGridGallery";
import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { galleryService } from "@/services/api/gallery.service";
import { useBrandStore } from "@/store/brand.store";
import { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  RefObject,
} from "react";
import { toast } from "sonner";
import { SortablePhoto } from "@/components/gallery/SortableGallery";
import { Photo } from "react-photo-album";
import ManualMoodboardSkeleton from "../moodboards/MoodboardSkeleton";
import { EditIcon } from "@/components/ui/custom-icon";
import { UseFormReturn } from "react-hook-form";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  form: UseFormReturn<any>;
  formRef: RefObject<HTMLDivElement | null>;
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
  moodboardInformation,
  form,
  formRef,
}: ReferenceMoodboardProps) => {
  const [n, setN] = useState<number | "">(prompts?.length || "");
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Load images with proper width/height calculation
  const loadImagesWithDimensions = useCallback(async () => {
    if (!orderedGalleryItems || orderedGalleryItems.length === 0) {
      setPhotos([]);
      return;
    }

    setLoading(true);

    try {
      const loaded = await Promise.all(
        orderedGalleryItems.map(
          (item) =>
            new Promise<SortablePhoto<Photo>>((resolve) => {
              const img = new Image();
              img.src = item.asset_url;
              img.onload = () => {
                resolve({
                  id: item.id,
                  src: item.asset_url,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  alt: `Reference image ${item.id}`,
                  liked: false, // Reference images don't have like functionality
                });
              };
              img.onerror = () => {
                console.warn("Could not load image", item.asset_url);
                resolve({
                  id: item.id,
                  src: item.asset_url,
                  width: 800,
                  height: 600,
                  alt: `Fallback reference image ${item.id}`,
                  liked: false,
                });
              };
            })
        )
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

  // Display logic
  const showGallery = useMemo(() => {
    return photos.length > 0 && !loading && !isBulkFetching && !isBulkLoading;
  }, [photos.length, loading, isBulkFetching, isBulkLoading]);

  useEffect(() => {
    if (prompts && prompts.length > 0) {
      setN(prompts.length);
    }
  }, [prompts]);

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
          {showGallery && photos.length > 0 && (
            <div className="mx-auto max-w-7xl w-full px-2">
              <CustomGridGallery photos={photos} isPreview={true} />
            </div>
          )}

          {photos.length == 0 && (
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
                        form.setValue("prompt", prompt, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });

                        if (formRef.current) {
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
