import { Button } from "@/components/ui/button";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

// Asset cell component with MediaEditor dialog functionality
export const TaskListAssetCell = ({
  assetUrl,
  assetId,
}: {
  assetUrl: string;
  assetId?: string;
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

  const galleryItem = assetId
    ? galleryActions.useGalleryItem(assetId)
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

  return (
    <>
      <div className="flex items-center gap-2 overflow-hidden justify-center text-center">
        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
          <Image
            src={assetUrl}
            alt="Asset thumbnail"
            fill
            className="object-cover"
            sizes="40px"
          />
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
