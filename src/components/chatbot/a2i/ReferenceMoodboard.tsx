import CustomGridGallery from "@/components/gallery/CustomGridGallery";
import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGalleryQuery } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { SortablePhoto } from "@/components/gallery/SortableGallery";
import { Photo } from "react-photo-album";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
  moodboardInformation,
}: ReferenceMoodboardProps) => {
  const [n, setN] = React.useState(`${prompts?.length || 0}`);
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [loading, setLoading] = useState(false);

  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard, isPending } = useMutation({
    mutationFn: () =>
      generateA2iShowboard(selectedBrandId!, referenceMoodboardId!, Number(n)),
  });

  const { galleryItems, isFetching } = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [referenceMoodboardId ?? ""],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    200
  );

  const selectedMoodboard = moodboardInformation?.find(
    (mb) => mb.id === referenceMoodboardId
  );
  // Filter and order gallery items by moodboard position
  const filteredGalleryItems = useMemo(() => {
    if (
      !galleryItems ||
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

    // Filter gallery items that exist in moodboard and add position info
    const itemsWithPosition = galleryItems
      .filter((item) => positionMap.has(item.id))
      .map((item) => ({
        ...item,
        position: positionMap.get(item.id)!,
      }));

    // Sort by position
    return itemsWithPosition.sort((a, b) => a.position - b.position);
  }, [galleryItems, selectedMoodboard?.moodboard_assets]);

  // Load images with proper width/height calculation - following MoodboardLayout approach
  const loadImagesWithDimensions = useCallback(async () => {
    if (!filteredGalleryItems || filteredGalleryItems.length === 0) {
      setPhotos([]);
      return;
    }

    setLoading(true);

    try {
      const loaded = await Promise.all(
        filteredGalleryItems.map(
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

      console.log("Loaded reference photos:", loaded);
      setPhotos(loaded);
    } catch (error) {
      console.error("Failed to load reference images:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [filteredGalleryItems]);

  // Load images when filtered gallery items are available
  useEffect(() => {
    if (filteredGalleryItems.length > 0) {
      const timeoutId = setTimeout(() => {
        loadImagesWithDimensions();
      }, 50);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear photos if no filtered items
      setPhotos([]);
    }
  }, [filteredGalleryItems.length, loadImagesWithDimensions]);

  // Display logic
  const showGallery = useMemo(() => {
    return photos.length > 0 && !loading && !isFetching;
  }, [photos.length, loading, isFetching]);

  useEffect(() => {
    if (prompts && prompts.length > 0) {
      setN(`${prompts.length}`);
    } else {
      setN("0");
    }
  }, [prompts]);

  console.log(photos.length);

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
              <CustomGridGallery photos={photos} />
            </div>
          )}

          {photos.length == 0 && <ImageGridSkeleton isLoading={isFetching} />}

          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Prompts</h3>
                  <Input
                    type="number"
                    value={n}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setN("");
                        return;
                      }

                      const parsed = parseInt(value, 10);

                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                        setN(value);
                      }
                    }}
                    min={1}
                    max={10}
                  />
                </div>
                {referenceMoodboardId && (
                  <Button
                    variant={"outline"}
                    className="text-primary border-primary"
                    disabled={isPending}
                    onClick={() =>
                      generateShowboard(undefined, {
                        onError: () => {
                          toast.error(
                            `Failed to generate showboard. Please try again.`
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
                  <Textarea
                    key={prompt}
                    value={prompt}
                    readOnly
                    className="min-h-40 max-h-40"
                  />
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

export const ImageGridSkeleton = ({ isLoading }: { isLoading: boolean }) => {
  const gridItems = [
    { colSpan: 2, rowSpan: 2, colStart: 1, rowStart: 1 },
    { colSpan: 3, rowSpan: 2, colStart: 3, rowStart: 1 },
    { colSpan: 3, rowSpan: 1, colStart: 6, rowStart: 1 },

    { colSpan: 3, rowSpan: 1, colStart: 6, rowStart: 2 },
    { colSpan: 2, rowSpan: 2, colStart: 1, rowStart: 3 },
    { colSpan: 3, rowSpan: 2, colStart: 3, rowStart: 3 },

    { colSpan: 2, rowSpan: 2, colStart: 6, rowStart: 3 },
    { colSpan: 2, rowSpan: 1, colStart: 8, rowStart: 3 },
    { colSpan: 2, rowSpan: 1, colStart: 8, rowStart: 4 },

    { colSpan: 3, rowSpan: 1, colStart: 1, rowStart: 5 },
    { colSpan: 2, rowSpan: 1, colStart: 4, rowStart: 5 },
    { colSpan: 3, rowSpan: 1, colStart: 6, rowStart: 5, extra: "h-24" },
  ];
  return (
    <div
      className={cn("grid grid-cols-8 grid-rows-5 gap-2", {
        "animate-pulse": isLoading,
      })}
    >
      {gridItems.map((item, idx) => {
        const { colSpan = 1, rowSpan = 1, colStart, rowStart, extra } = item;
        return (
          <div
            key={idx}
            className={cn(
              "bg-muted rounded-md",
              `col-span-${colSpan}`,
              `row-span-${rowSpan}`,
              colStart && `col-start-${colStart}`,
              rowStart && `row-start-${rowStart}`,
              extra,
              isLoading && "animate-pulse"
            )}
          />
        );
      })}
    </div>
  );
};
