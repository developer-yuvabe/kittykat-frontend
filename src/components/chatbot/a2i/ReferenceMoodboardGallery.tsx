import CustomGalleryContainer from "@/components/gallery/CustomGalleryContainer";
import ManualMoodboardSkeleton from "../moodboards/MoodboardSkeleton";
import { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { MoodboardInformation } from "@/types/types";
import { Dispatch, SetStateAction } from "react";

type ReferenceMoodboardGalleryProps = {
  items: UnifiedMoodboardItem[];
  setItems: Dispatch<SetStateAction<UnifiedMoodboardItem[]>>;
  selectedMoodboard: MoodboardInformation | undefined;
  loading: boolean;
  isBulkLoading: boolean;
  isBulkFetching: boolean;
  isSwitching: boolean;
  noOfImagesForMoodboard: number;
};

export const ReferenceMoodboardGallery = ({
  items,
  setItems,
  selectedMoodboard,
  loading,
  isBulkLoading,
  isBulkFetching,
  isSwitching,
  noOfImagesForMoodboard,
}: ReferenceMoodboardGalleryProps) => {
  const isLoading =
    loading ||
    isBulkFetching ||
    isBulkLoading ||
    !selectedMoodboard ||
    isSwitching;

  if (isLoading) {
    return <ManualMoodboardSkeleton shimmer={isSwitching} showButton={false} />;
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-2">
      <CustomGalleryContainer
        items={items}
        setItems={setItems}
        moodboard={{
          ...selectedMoodboard,
          moodboard_assets: items.map((item, index) => ({
            gallery_item_id: item.id,
            position: index,
          })),
        }}
        hasUnsavedChanges={false}
        isPreview
        overrideNoOfImages={noOfImagesForMoodboard}
        key={selectedMoodboard?.id}
      />
    </div>
  );
};
