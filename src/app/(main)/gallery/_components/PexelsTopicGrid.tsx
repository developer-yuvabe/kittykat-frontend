"use client";

import { useEffect, useState } from "react";
import { fetchTopics } from "@/services/api/pexels.service";
import { PhotosWithTotalResults, ErrorResponse } from "pexels";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BulkGalleryUploadRequest,
  GalleryItem,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { getExtensionFromUrl } from "@/lib/utils";
import { useGalleryQuery } from "@/hooks/useGallery";
import Masonry from "react-masonry-css";
import { PexelsMasonryImageCard } from "./PexelsMasonryImageCard";
import { MediaDialogMultiSelectHeader } from "./MediaDialogMultiSelectHeader";
import { useInView } from "react-intersection-observer";
import { PexelsTopicsResponse } from "@/types/pexels.types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { searchPexelsPhotos } from "@/services/actions/pexels-client";

interface TopicsGridProps {
  selectedBrandId: string | null;
  selectedCampaignId?: string;
  selecteMoodboardId?: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  currentSelectionCount: number;
  onMultipleMediaItemsSelected?: (items: GalleryItemResponse[]) => void;
  isMultiSelect?: boolean;
  isMediaSelectDialog?: boolean;
  inSelectionGalleryIds?: string[]; // gallery item ids that are already selected
  closeDialog?: () => void;
}

export default function TopicsGrid({
  selectedBrandId,
  selectedCampaignId,
  selecteMoodboardId,
  setActiveTab,
  onMultipleMediaItemsSelected,
  inSelectionGalleryIds = [],
  isMultiSelect = false,
  isMediaSelectDialog = false,
  closeDialog,
}: TopicsGridProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const galleryActions = useGalleryQuery({});

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
  };

  //Debounce search (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  //Clear selection when query changes
  useEffect(() => {
    setSelected([]);
  }, [debouncedSearch]);

  const {
    data: topicsResponse,
    isLoading: topicsLoading,
    isError: topicsError,
  } = useQuery<PexelsTopicsResponse>({
    queryKey: ["topics", selectedBrandId, selectedCampaignId],
    queryFn: () =>
      fetchTopics(selectedBrandId ?? "", selectedCampaignId ?? null),
    enabled: !!selectedBrandId, // only run when brand is selected
  });

  // 📡 React Query Infinite Scroll for Search
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery<PhotosWithTotalResults, ErrorResponse>({
      queryKey: ["search", debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
        if (!debouncedSearch) throw new Error("No search query provided");
        const result = await searchPexelsPhotos(
          debouncedSearch,
          pageParam as number,
          30
        );

        if ("photos" in result) {
          return result;
        }
        throw new Error((result as ErrorResponse).error ?? "API Error");
      },
      getNextPageParam: (lastPage) =>
        lastPage.next_page ? lastPage.page + 1 : undefined,
      enabled: !!debouncedSearch,
      initialPageParam: 1,
    });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSelect = (url: string) => {
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const onClearSelection = () => {
    setSelected([]);
  };

  const handleUrlUpload = async (urls: string[]) => {
    if (!selectedBrandId) {
      toast.error("No brand selected.");
      return;
    }

    try {
      const validUrls = urls.filter((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

      if (validUrls.length === 0) {
        toast.error("No valid URLs provided");
        return;
      }

      const itemsToUpload: GalleryItem[] = validUrls.map((url) => {
        const extension = getExtensionFromUrl(url);
        return {
          brand_id: selectedBrandId,
          asset_url: url,
          asset_source: "brand-uploads",
          asset_type: "image",
          media_format: extension,
          asset_title: url.split("/").pop() || url,
          size: "",
          related_asset_ids: [],
          prompt_modifiers: [],
          ai_tags: [],
          visual_style_tags: {},
          detected_objects: [],
          detected_emotions: [],
          detected_colors: [],
          search_keywords: [],
          custom_tags: [],
          campaign_id: selectedCampaignId,
          moodboard_id: selecteMoodboardId,
          is_master: true,
        };
      });

      const bulkUploadPayload: BulkGalleryUploadRequest = {
        gallery_items: itemsToUpload,
        brand_id: selectedBrandId,
        campaign_id: selectedCampaignId,
        moodboard_id: selecteMoodboardId,
        scrape_only: false,
      };
      setActiveTab("all-media");
      await galleryActions.bulkUpload(bulkUploadPayload);
      toast.success(`${validUrls.length} URL(s) uploaded successfully!`);
    } catch (error) {
      console.error("URL upload failed:", error);
      toast.error("URL upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  const handleAddToGallery = async () => {
    if (selected.length === 0) {
      toast.error("No images selected");
      return;
    }
    try {
      await handleUrlUpload(selected);
      toast.success("Added to Gallery");
      setSelected([]); // clear after upload
    } catch {
      toast.error("Added to Gallery failed");
    }
  };

  const onAddSelectedItemsToMoodboard = async () => {
    if (!selectedBrandId) {
      toast.error("No brand selected.");
      return;
    }

    try {
      const validUrls = selected.filter((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });

      if (validUrls.length === 0) {
        toast.error("No valid URLs provided");
        return;
      }

      const itemsToUpload: GalleryItem[] = validUrls.map((url) => {
        const extension = getExtensionFromUrl(url);
        return {
          brand_id: selectedBrandId,
          asset_url: url,
          asset_source: "brand-uploads",
          asset_type: "image",
          media_format: extension,
          asset_title: url.split("/").pop() || url,
          size: "",
          related_asset_ids: [],
          prompt_modifiers: [],
          ai_tags: [],
          visual_style_tags: {},
          detected_objects: [],
          detected_emotions: [],
          detected_colors: [],
          search_keywords: [],
          custom_tags: [],
          campaign_id: selectedCampaignId,
          moodboard_id: selecteMoodboardId,
          is_master: true,
        };
      });

      const bulkUploadPayload: BulkGalleryUploadRequest = {
        gallery_items: itemsToUpload,
        brand_id: selectedBrandId,
        campaign_id: selectedCampaignId,
        moodboard_id: selecteMoodboardId,
        scrape_only: false,
      };

      // Fire and forget - we handle success/failure with toasts
      galleryActions.bulkUpload(bulkUploadPayload).then((res) => {
        toast.success(`${validUrls.length} image(s) added to moodboard!`);
        onMultipleMediaItemsSelected?.(res);
      });

      closeDialog?.();

      setSelected([]);
    } catch (error) {
      console.error("Adding to moodboard failed:", error);
      toast.error("URL upload failed", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  return (
    <div className="p-4 relative">
      {/* 🔍 Search Bar (shadcn input + clear button) */}
      <div className="mb-4">
        <div className="relative w-full">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search millions of online images..."
            className="pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {topicsResponse?.editor_choice && (
          <div className="mt-3 ml-1 flex items-center gap-2">
            <Checkbox
              id="editorChoice"
              checked={search === topicsResponse.editor_choice}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSearch(topicsResponse.editor_choice);
                } else {
                  setSearch(""); // reset search on uncheck
                }
              }}
            />
            <Label
              htmlFor="editorChoice"
              className="font-semibold text-gray-700 cursor-pointer"
            >
              Ask KittyKat – Brand & Campaign Choice
            </Label>
          </div>
        )}
      </div>

      {/* Grid Section */}
      {debouncedSearch ? (
        <>
          {isFetching && !data ? (
            <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div>
              <MediaDialogMultiSelectHeader
                isActive={isMultiSelect && isMediaSelectDialog}
                currentSelectionCount={selected.length}
                onClearSelection={onClearSelection}
                onAddSelectedItems={onAddSelectedItemsToMoodboard}
                totalAssets={selected.length + inSelectionGalleryIds.length}
              />
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-auto -ml-4"
                columnClassName="pl-4 bg-clip-padding"
              >
                {data?.pages.map((page) =>
                  page.photos.map((photo) => (
                    <PexelsMasonryImageCard
                      key={photo.id}
                      photo={photo}
                      isChecked={selected.includes(photo.src.original)}
                      onToggle={() => toggleSelect(photo.src.original)}
                    />
                  ))
                )}
              </Masonry>
            </div>
          )}

          {/* Loader for next page */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}

          <div ref={ref} className="h-10" />
        </>
      ) : topicsLoading ? (
        <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : topicsError ? (
        <p className="text-center text-red-500">Failed to load topics.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {topicsResponse?.topics.map((t) => (
            <div
              key={t.id}
              className="relative cursor-pointer overflow-hidden shadow-md group"
              onClick={() => setSearch(t.topic)}
            >
              <img
                src={t.thumbnail_url || "https://via.placeholder.com/300"}
                alt={t.topic ?? ""}
                className="w-full h-40 object-cover transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {t.topic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky Footer for Add to Gallery */}

      {selected.length > 0 && isMultiSelect == false && (
        <div className="fixed bottom-0 left-0 right-0 pr-20 bg-white border-t shadow-md p-4 flex items-center justify-end gap-5">
          <span className="text-sm font-medium">
            Selected: {selected.length}
          </span>
          <Button
            onClick={handleAddToGallery}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Add to Gallery
          </Button>
        </div>
      )}
    </div>
  );
}
