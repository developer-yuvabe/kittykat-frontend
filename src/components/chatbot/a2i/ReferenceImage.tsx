"use client";
import { useState, useEffect } from "react";
import { ImageDisplay } from "./ImageDisplay";
import { ContentSection } from "@/components/shared/ContentSection";
import { ActionButtonsRow } from "./ActionButtonsRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Image, Target } from "lucide-react";
import { MoodboardAsset, ThreadA2iImage, ThreadCampaign } from "@/types/types";

// Mock API functions
const mockUpdateReferenceImage = async (
  campaignId: string,
  moodboardId: string,
  imageId: string
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Updated reference:", { campaignId, moodboardId, imageId });
      resolve({ success: true });
    }, 500);
  });
};

const mockUpdateCampaignSelection = async (campaignId: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Updated campaign selection:", { campaignId });
      resolve({ success: true });
    }, 300);
  });
};

interface ReferenceImageSectionProps {
  campaignInformation: ThreadCampaign[] | undefined;
  a2iImageInformation: ThreadA2iImage | undefined;
}

export function ReferenceImage({
  campaignInformation,
  a2iImageInformation,
}: ReferenceImageSectionProps) {
  const [selectedMoodboard, setSelectedMoodboard] =
    useState<MoodboardAsset | null>(null);
  const [isMoodboardModalOpen, setIsMoodboardModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [isCampaignUpdating, setIsCampaignUpdating] = useState(false);

  // Get the current campaign based on selected campaign
  const getCurrentCampaign = () => {
    if (!campaignInformation?.length || !selectedCampaignId) return null;
    return campaignInformation.find(
      (campaign) => campaign.id === selectedCampaignId
    );
  };

  // Initialize with last campaign and existing reference
  useEffect(() => {
    if (campaignInformation?.length) {
      // Default to last campaign if no specific campaign is referenced
      const defaultCampaignId =
        a2iImageInformation?.refernce_campaign_id ||
        campaignInformation[campaignInformation.length - 1].id;
      setSelectedCampaignId(defaultCampaignId);

      // Set existing reference moodboard if available
      if (a2iImageInformation?.reference_moodboard_id) {
        const campaign = campaignInformation.find(
          (c) => c.id === defaultCampaignId
        );
        const existingMoodboard = campaign?.moodboards?.find(
          (mb) => mb.id === a2iImageInformation.reference_moodboard_id
        );
        if (existingMoodboard) {
          setSelectedMoodboard(existingMoodboard);
        }
      }
    }
  }, [campaignInformation, a2iImageInformation]);

  const handleCampaignSelect = async (campaignId: string) => {
    setIsCampaignUpdating(true);
    try {
      await mockUpdateCampaignSelection(campaignId);
      setSelectedCampaignId(campaignId);
      // Clear moodboard selection when campaign changes unless it's the same reference
      if (
        selectedMoodboard &&
        a2iImageInformation?.refernce_campaign_id !== campaignId
      ) {
        setSelectedMoodboard(null);
      }
    } catch (error) {
      console.error("Failed to update campaign selection:", error);
    } finally {
      setIsCampaignUpdating(false);
    }
  };

  const handleMoodboardSelect = async (moodboard: MoodboardAsset) => {
    const currentCampaign = getCurrentCampaign();
    if (!currentCampaign?.id) return;

    setIsUpdating(true);
    try {
      await mockUpdateReferenceImage(
        currentCampaign.id,
        moodboard.id,
        moodboard.id
      );
      setSelectedMoodboard(moodboard);
      setIsMoodboardModalOpen(false);
    } catch (error) {
      console.error("Failed to update reference image:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderContent = () => {
    if (!campaignInformation?.length) {
      return (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Campaigns Available</h3>
          <p className="text-muted-foreground">
            Please create a campaign first to get started
          </p>
        </div>
      );
    }

    const currentCampaign = getCurrentCampaign();

    return (
      <div className="space-y-6">
        {/* Campaign Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium ">Campaign</label>
          <div className="mt-5">
            <Select
              value={selectedCampaignId || ""}
              onValueChange={handleCampaignSelect}
              disabled={isCampaignUpdating}
            >
              <SelectTrigger className="w-full px-4 py-8">
                <SelectValue placeholder="Choose a campaign" />
              </SelectTrigger>

              <SelectContent>
                {campaignInformation.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex flex-col ">
                      <span className="font-medium">
                        {campaign.campaign?.title ||
                          `Campaign ${campaign.id.slice(0, 8)}`}
                      </span>
                      {campaign.campaign?.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {campaign.campaign.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isCampaignUpdating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Updating campaign...
            </div>
          )}
        </div>

        {/* Moodboard Selection */}
        {currentCampaign && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Reference Moodboard</label>
              <Button
                variant="outline"
                onClick={() => setIsMoodboardModalOpen(true)}
                disabled={!currentCampaign.moodboards?.length}
              >
                {selectedMoodboard ? "Change Selection" : "Select Moodboard"}
              </Button>
            </div>

            {!currentCampaign.moodboards?.length ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No moodboards available for this campaign</p>
              </div>
            ) : selectedMoodboard ? (
              <div className="space-y-4">
                <div className="relative max-w-md mx-auto">
                  <ImageDisplay
                    src={selectedMoodboard.asset_url}
                    alt={selectedMoodboard.asset_title}
                    className="aspect-square w-full"
                    onSelect={() => {}}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>
                  Click &quot;Select Moodboard&quot; to choose a reference image
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const currentCampaign = getCurrentCampaign();
  const title = currentCampaign?.campaign?.title || "Reference Image Setup";

  return (
    <>
      <ContentSection
        title={`Reference Image: ${title}`}
        content={renderContent()}
      />

      {/* Moodboard Selection Modal */}
      <Dialog
        open={isMoodboardModalOpen}
        onOpenChange={setIsMoodboardModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Reference Moodboard</DialogTitle>
          </DialogHeader>

          {currentCampaign?.moodboards?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentCampaign.moodboards.map((moodboard) => (
                <Card
                  key={moodboard.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMoodboard?.id === moodboard.id
                      ? "ring-2 ring-primary"
                      : ""
                  } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleMoodboardSelect(moodboard)}
                >
                  <CardContent className="p-3">
                    <div className="relative">
                      <img
                        src={moodboard.asset_url}
                        alt={moodboard.asset_title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      {selectedMoodboard?.id === moodboard.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-6 w-6 text-primary bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm truncate">
                        {moodboard.asset_title}
                      </h4>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {moodboard.aspect_ratio}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {moodboard.media_format.toUpperCase()}
                        </span>
                      </div>
                      {moodboard.comment && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {moodboard.comment}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No moodboards available for this campaign</p>
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
    </>
  );
}
