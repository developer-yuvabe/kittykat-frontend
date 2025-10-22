import MoodboardSelector from "../moodboards/MoodboardSelector";
import { MoodboardInformation, ThreadCampaign } from "@/types/types";

type ReferenceMoodboardEmptyProps = {
  moodboardInformation: MoodboardInformation[] | undefined;
  currentCampaign: ThreadCampaign | null;
  onMoodboardChange: (moodboard: MoodboardInformation | null) => void;
};

export const ReferenceMoodboardEmpty = ({
  moodboardInformation,
  currentCampaign,
  onMoodboardChange,
}: ReferenceMoodboardEmptyProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <p className="text-gray-500 text-center">
        The reference moodboard has been deleted or is no longer available.
      </p>
      {moodboardInformation && moodboardInformation.length > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">Select a different moodboard:</p>
          <MoodboardSelector
            campaignId={
              currentCampaign?.id || moodboardInformation[0].campaign_id!
            }
            moodboards={moodboardInformation}
            selectedMoodboard={null}
            setSelectedMoodboard={onMoodboardChange}
            isCreatingNew={false}
            onNewMoodboard={() => {}}
            showAllCampaigns={true}
          />
        </div>
      )}
    </div>
  );
};
