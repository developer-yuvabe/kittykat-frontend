// Action Buttons Component

import { Button } from "@/components/ui/button";
import { DeleteIcon, DownloadIcon } from "@/components/ui/custom-icon";
import { useBrandStore } from "@/store/brand.store";
import { GalleryItemResponse } from "@/types/gallery.types";
import { PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface MediaItemActionsButtonProps {
  item: GalleryItemResponse;
  onDetailsClick: (item: GalleryItemResponse) => void;
  onDownload: (item: GalleryItemResponse, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function MediaItemActionsButton({
  item,
  onDownload,
  onDelete,
}: MediaItemActionsButtonProps) {
  const router = useRouter();

  const {
    setSelectedMoodboardId,
    setSelectedCampaignId,
    setDialogCampaignId,
  } = useBrandStore();

  const handleEditMoodboard = () => {
    // Set both campaign and moodboard to ensure proper context
    if (item.campaign_id) {
      setSelectedCampaignId(item.campaign_id);
    }
    setSelectedMoodboardId(item.moodboard_id || null);

    if (item.campaign_id && item.moodboard_id) {
      router.push(
        `/?campaignId=${item.campaign_id}&moodboardId=${item.moodboard_id}`
      );
    }
  };

  return (
    <>
      {/* Details button */}
      {/* <Button
        variant="ghost"
        onClick={() => onDetailsClick(item)}
        className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
      >
        <Info size={20} />
        <span className="ml-2">View Details</span>
      </Button> */}

      {/* Download button */}
      <Button
        variant="ghost"
        onClick={(e) => onDownload(item, e)}
        className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
      >
        <DownloadIcon size={20} />
        <span className="ml-2">Download</span>
      </Button>

      {/* Delete button */}
      <Button
        variant="ghost"
        onClick={(e) => onDelete(item.id, e)}
        className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
      >
        <DeleteIcon size={20} />
        <span className="ml-2">Delete</span>
      </Button>
      {item.asset_source === "moodboard" && (
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start hover:bg-gray-100 transition-colors cursor-pointer text-left p-2 rounded-md hover:text-foreground"
          onClick={handleEditMoodboard}
        >
          <PencilIcon size={20} />
          <span className="ml-2">Edit Moodboard</span>
        </Button>
      )}
    </>
  );
}
