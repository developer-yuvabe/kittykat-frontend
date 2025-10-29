import { Button } from "@/components/ui/button";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

// Asset cell component with MediaEditor dialog functionality
export const TaskListAssetCell = ({
  assetUrls,
  assetIds,
}: {
  assetUrls: string[]; // Array of URLs
  assetIds: string[]; // Array of IDs
}) => {
  const { openConceptVisual } = useConceptVisualStore();
  const { selectedBrandId } = useBrandStore();

  const galleryActions = useGalleryQuery(
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
    ITEMS_PER_PAGE,
    true,
    "TaskListAssetCell"
  );

  // Get the first gallery item for display
  const firstAssetId = assetIds[0];
  const galleryItem = firstAssetId
    ? galleryActions.useGalleryItem(firstAssetId)
    : undefined;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (galleryItem && galleryItem.data)
      openConceptVisual({
        source: "media-gallery",
        assetItems: [galleryItem.data],
        asset: {
          galleryActions,
          currentAsset: galleryItem.data,
        },
      });
  };

  // Check if the asset is a video
  const isVideo =
    galleryItem?.data?.asset_type === "video" 

  return (
    <>
      <div className="flex items-center gap-2 overflow-hidden justify-center text-center">
        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
            <>
              {isVideo ? (
                <video
                  src={assetUrls[0]}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={assetUrls[0]}
                  alt="Asset thumbnail"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              )}
            </>
          {assetUrls.length > 1 && (
            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-tl">
              +{assetUrls.length - 1}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEditClick}
          className="h-6 w-6 p-0"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </>
  );
};
