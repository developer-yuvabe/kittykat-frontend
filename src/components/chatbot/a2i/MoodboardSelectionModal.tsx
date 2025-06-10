import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Image } from "lucide-react";
import { MoodboardAsset, ThreadCampaign } from "@/types/types";

interface MoodboardSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  moodboards: MoodboardAsset[];
  selectedMoodboard: MoodboardAsset | null;
  isUpdating: boolean;
  onSelect: (
    moodboard: MoodboardAsset & { campaignId: string; campaignTitle?: string }
  ) => void | Promise<void>;
  campaignInformation: ThreadCampaign | null;
}

export const MoodboardSelectionModal = ({
  isOpen,
  onOpenChange,
  moodboards,
  selectedMoodboard,
  isUpdating,
  onSelect,
  campaignInformation,
}: MoodboardSelectionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-lg md:min-w-4xl lg:min-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Reference Moodboard</DialogTitle>
        </DialogHeader>

        {moodboards.length ? (
          <Carousel className="w-full mt-4">
            <CarouselContent>
              {moodboards.map((moodboard, index) => (
                <CarouselItem
                  key={moodboard.id || index}
                  className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 m-2"
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md h-full ${
                      selectedMoodboard?.id === moodboard.id
                        ? "ring-2 ring-primary"
                        : ""
                    } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() =>
                      onSelect({
                        ...moodboard,
                        campaignId: campaignInformation?.id ?? "",
                        campaignTitle: campaignInformation?.campaign?.title,
                      })
                    }
                  >
                    <CardContent className="p-4 h-full flex flex-col justify-between">
                      <div className="flex-1 flex items-center justify-center relative mb-3">
                        <img
                          src={moodboard.asset_url}
                          alt={moodboard.asset_title}
                          className="w-full max-h-32 object-contain rounded-md"
                        />
                        {selectedMoodboard?.id === moodboard.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="h-6 w-6 text-primary bg-white rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-medium text-sm truncate">
                          {campaignInformation?.campaign?.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {moodboard.asset_title}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {moodboard.aspect_ratio}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {moodboard.media_format.toUpperCase()}
                          </span>
                        </div>
                        {moodboard.comment && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {moodboard.comment}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative transform-none mx-2" />
              <CarouselNext className="relative transform-none mx-2" />
            </div>
          </Carousel>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No moodboards available</p>
          </div>
        )}

        {isUpdating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Updating reference...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
