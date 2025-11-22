import MoodboardSelector from "../moodboards/MoodboardSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { MoodboardInformation } from "@/types/types";

type ReferenceMoodboardHeaderProps = {
  selectedMoodboard: MoodboardInformation | undefined;
  moodboardInformation: MoodboardInformation[] | undefined;
  isSwitching: boolean;
  onMoodboardChange: (moodboard: MoodboardInformation | null) => void;
  isAdvancedMode: boolean;
};

export const ReferenceMoodboardHeader = ({
  selectedMoodboard,
  moodboardInformation,
  isSwitching,
  onMoodboardChange,
  isAdvancedMode,
}: ReferenceMoodboardHeaderProps) => {
  return (
    <div className="flex justify-between">
      {isSwitching ? (
        <div className="w-80">
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <p
          className={`font-semibold text-sm text-gray-600 break-words  max-w-xs`}
        >
          {selectedMoodboard?.title}
        </p>
      )}

      {moodboardInformation && selectedMoodboard?.campaign_id && (
        <MoodboardSelector
          campaignId={selectedMoodboard.campaign_id}
          moodboards={moodboardInformation}
          selectedMoodboard={selectedMoodboard}
          setSelectedMoodboard={onMoodboardChange}
          isCreatingNew={false}
          onNewMoodboard={() => {}}
          showAllCampaigns={true}
          isAdvancedMode={isAdvancedMode}
        />
      )}
    </div>
  );
};
