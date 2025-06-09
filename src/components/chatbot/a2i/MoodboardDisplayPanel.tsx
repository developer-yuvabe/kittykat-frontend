import { Button } from "@/components/ui/button";
import { MoodboardAsset } from "@/types/types";
import { Image as LucideImage } from "lucide-react";
import { ImageDisplay } from "./ImageDisplay";
import { ActionButtonsRow } from "./ActionButtonsRow";

interface MoodboardDisplayPanelProps {
  selectedMoodboard: MoodboardAsset | null;
  onOpenMoodboardModal: () => void;
  onGoToGenerator: () => void;
}

export const MoodboardDisplayPanel = ({
  selectedMoodboard,
  onOpenMoodboardModal,
  onGoToGenerator,
}: MoodboardDisplayPanelProps) => {
  return (
    <div className="space-y-4">
      {selectedMoodboard ? (
        <div className="space-y-4">
          <ImageDisplay
            src={selectedMoodboard.asset_url}
            alt={selectedMoodboard.asset_title}
            className="aspect-square w-full max-w-md mx-auto"
            onSelect={() => {}}
          />

          <ActionButtonsRow
            buttons={[
              {
                label: "Go to Generator",
                onClick: onGoToGenerator,
                color: "#EA916E",
                hoverColor: "#e7845d",
              },
              {
                label: "Select Board",
                onClick: onOpenMoodboardModal,
                hoverColor: "#5b5fd1",
                color: "#636AE8",
              },
            ]}
            className="flex justify-between 2xl:mx-8"
          />
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <LucideImage className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-muted-foreground mb-4">No moodboard selected</p>
          <Button onClick={onOpenMoodboardModal}>Select Moodboard</Button>
        </div>
      )}
    </div>
  );
};
