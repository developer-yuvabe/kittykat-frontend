import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { galleryService } from "@/services/api/gallery.service";
import { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import AddVersion from "./AddVersion";
import { useGalleryQuery } from "@/hooks/useGallery";
import { getExtensionFromUrl } from "@/lib/utils";
import { toast } from "sonner";

type AskKittykatVersionsProps = {
  item: GalleryItemResponse;
  currentVersion: GalleryItemResponse | null;
  onVersionChange: (item: GalleryItemResponse) => void;
};

const AskKittykatVersions = ({
  item,
  currentVersion,
  onVersionChange,
}: AskKittykatVersionsProps) => {
  const [showAddVersion, setShowAddVersion] = useState(false);
  const { addToGallery } = useGalleryQuery({});
  const { isFetching, data, refetch } = useQuery({
    queryKey: ["versions", item.id],
    queryFn: () => galleryService.getGalleryItemVersions(item.id),
    staleTime: Infinity,
  });

  const addVersion = async (uploadedUrl: string) => {
    const galleryItem: GalleryItem = {
      brand_id: item.brand_id,
      asset_url: uploadedUrl,
      asset_source: item.asset_source,
      asset_type: "image",
      media_format: getExtensionFromUrl(uploadedUrl),
      asset_title: `${item.asset_title} - Version ${(data?.length ?? 0) + 2}`,
      size: "",
      related_asset_ids: [],
      prompt_modifiers: [],
      ai_tags: [],
      visual_style_tags: [],
      detected_objects: [],
      detected_emotions: [],
      detected_colors: [],
      intent_tags: [],
      search_keywords: [],
      custom_tags: [],
      parent_asset_id: item.id,
    };

    addToGallery(galleryItem).then((item) => {
      toast.success("Version added successfully!");
      refetch().then(() => {
        if (item) {
          onVersionChange(item);
        }
      });
    });
    setShowAddVersion(false);
  };

  return (
    <div>
      {isFetching ? (
        <div className="flex items-center gap-x-4 flex-row-reverse">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-4 w-24 bg-gray-300 animate-pulse"
              style={{ width: `${index * 100 + 50}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto"
            onClick={() => {
              if (item.id === currentVersion?.id) return;
              onVersionChange(item);
            }}
          >
            Version 1
          </Button>
          {data?.map((version, idx) => (
            <Button
              key={version.id}
              variant="outline"
              size="sm"
              className="h-auto"
              onClick={() => {
                onVersionChange(version);
              }}
            >
              Version {idx + 2}
            </Button>
          ))}
          <AddVersion
            open={showAddVersion}
            onClose={() => setShowAddVersion(false)}
            addVersion={addVersion}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddVersion(true)}
            >
              +
            </Button>
          </AddVersion>
        </div>
      )}
    </div>
  );
};

export default AskKittykatVersions;
