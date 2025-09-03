"use client";

import { useEffect, useRef, useState } from "react";
import { fetchTopics, Topic } from "@/services/api/pexels.service";
import { createClient, PhotosWithTotalResults, ErrorResponse } from "pexels";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { env } from "@/config/env";
import {
  BrandCampaignListResponse,
  BulkGalleryUploadRequest,
  GalleryItem,
} from "@/types/gallery.types";
import { getExtensionFromUrl } from "@/lib/utils";
import { useGalleryQuery } from "@/hooks/useGallery";
import { Checkbox } from "@/components/ui/checkbox";

const client = createClient(env.NEXT_PUBLIC_PEXELS_API_KEY);

interface TopicsGridProps {
  selectedBrand?: BrandCampaignListResponse["brands"][number] | null;
  selectedCampaignId?: string;
  selecteMoodboardId?: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export default function TopicsGrid({
  selectedBrand,
  selectedCampaignId,
  selecteMoodboardId,
  setActiveTab,
}: TopicsGridProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const galleryActions = useGalleryQuery({});

  // ✅ Debounce search (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ✅ Clear selection when query changes
  useEffect(() => {
    setSelected([]);
  }, [debouncedSearch]);

  // 📡 React Query for Topics (trending)
  const {
    data: topics = [],
    isLoading: topicsLoading,
    isError: topicsError,
  } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => fetchTopics(),
  });

  // 📡 React Query Infinite Scroll for Search
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery<PhotosWithTotalResults, ErrorResponse>({
      queryKey: ["search", debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
        if (!debouncedSearch) throw new Error("No search query provided");
        const result = await client.photos.search({
          query: debouncedSearch,
          per_page: 32,
          page: pageParam as number,
        });

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

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSelect = (url: string) => {
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleUrlUpload = async (urls: string[]) => {
    if (!selectedBrand?.brand_id) {
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
          brand_id: selectedBrand.brand_id,
          asset_url: url,
          asset_source: "pexels",
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
        brand_id: selectedBrand.brand_id,
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
      toast.success("Added to moodboard!");
      setSelected([]); // clear after upload
    } catch {
      toast.error("Failed to add to moodboard");
    }
  };

  return (
    <div className="p-4 relative">
      {/* 🔍 Search Bar (shadcn input + clear button) */}
      <div className="mb-4 flex items-center">
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
      </div>

      {/* Grid Section */}
      {debouncedSearch ? (
        <>
          {isFetching && !data ? (
            <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data?.pages.map((page) =>
                page.photos.map((photo) => {
                  const isChecked = selected.includes(photo.src.medium);
                  return (
                    <div
                      key={photo.id}
                      className="relative cursor-pointer overflow-hidden shadow-md group"
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelect(photo.src.medium)}
                          className="h-5 w-5 border-2 border-white data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200 hover:border-gray-200"
                        />
                      </div>
                      <img
                        src={photo.src.medium}
                        alt={photo.alt ?? ""}
                        className="w-full h-40 object-cover transition-transform duration-300"
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}
        </>
      ) : topicsLoading ? (
        <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : topicsError ? (
        <p className="text-center text-red-500">Failed to load topics.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topics.map((t) => (
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

      {/* Sticky Footer for Moodboard */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-3 bg-white border-t shadow-md p-4 flex items-center justify-end gap-3">
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
