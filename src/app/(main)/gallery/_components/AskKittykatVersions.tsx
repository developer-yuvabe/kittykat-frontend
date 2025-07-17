import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { cn, getExtensionFromUrl } from "@/lib/utils";
import { galleryService } from "@/services/api/gallery.service";
import { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import AddVersion from "./AddVersion";
import { toast } from "sonner";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { useEffect } from "react";

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
  const { user } = useUserStore();
  const { addToGallery } = useGalleryQuery(
    {},
    ITEMS_PER_PAGE,
    true,
    "AskKittykatVersions"
  );
  const { isFetching, data, refetch } = useQuery({
    queryKey: ["versions", item.id],
    queryFn: () => galleryService.getGalleryItemVersions(item.id),
    staleTime: Infinity,
  });

  const addVersion = async (uploadedUrl: string) => {
    const galleryItem: GalleryItem = {
      brand_id: item.brand_id,
      campaign_id: item.campaign_id,
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
      search_keywords: [],
      custom_tags: [],
      parent_asset_id: item.id,
      is_master: false,
      workflow_status: "in_review",
    };

    addToGallery(galleryItem).then((item) => {
      toast.success("Version added successfully!");
      refetch().then(() => {
        if (item) {
          onVersionChange(item);
        }
      });
    });
  };

  useEffect(() => {
    if (data) {
      for (const version of data) {
        if (version.id === currentVersion?.id) {
          onVersionChange(version);
          return;
        }
      }
    }
  }, [data]);

  return (
    <div className="flex-shrink-0 flex flex-col py-2">
      {isFetching ? (
        <div className="flex items-center gap-x-4 w-max">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-4 w-24 bg-gray-300 animate-pulse"
            />
          ))}
          <Skeleton className="h-4 w-4 rounded-full bg-gray-300 animate-pulse" />
        </div>
      ) : (
        <div className="flex items-center gap-x-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (item.id === currentVersion?.id) return;
              onVersionChange(item);
            }}
            className={cn("h-max", {
              "border border-primary bg-muted": currentVersion?.id === item.id,
            })}
          >
            Version 1
          </Button>
          {data?.map((version, idx) => (
            <Button
              key={version.id}
              variant="ghost"
              size="sm"
              className={cn("h-max", {
                "border border-primary bg-muted":
                  currentVersion?.id === version.id,
              })}
              onClick={() => {
                onVersionChange(version);
              }}
            >
              Version {idx + 2}
            </Button>
          ))}
          {user?.role.id === UserRoleId.ADMIN && (
            <AddVersion
              addVersion={addVersion}
              brandId={item.brand_id}
              campaignId={item.campaign_id}
            >
              <Button size="sm" variant={"ghost"} className="flex-1">
                <Plus className="w-6 h-6" />
              </Button>
            </AddVersion>
          )}
        </div>
      )}
    </div>
  );
};

export default AskKittykatVersions;
