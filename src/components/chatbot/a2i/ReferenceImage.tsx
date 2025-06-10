"use client";
import { useState, useEffect, useRef } from "react";
import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Palette, Users, Loader2 } from "lucide-react";
import { MoodboardAsset, ThreadA2iImage, ThreadCampaign } from "@/types/types";
import {
  updateReferenceCampaignId,
  updateReferenceMoodboardId,
} from "@/hooks/useParameterManagement";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { MoodboardSelectionModal } from "./MoodboardSelectionModal";
import { MoodboardDisplayPanel } from "./MoodboardDisplayPanel";

interface ReferenceImageSectionProps {
  campaignInformation: ThreadCampaign[] | undefined;
  a2iImageInformation: ThreadA2iImage | undefined;
  brandId: string;
}

export function ReferenceImage({
  campaignInformation,
  a2iImageInformation,
  brandId,
}: ReferenceImageSectionProps) {
  // Keep local state for fallback scenarios
  const [selectedMoodboard, setSelectedMoodboard] =
    useState<MoodboardAsset | null>(null);
  const [selectedCampaign, setSelectedCampaign] =
    useState<ThreadCampaign | null>(null);
  const [isMoodboardModalOpen, setIsMoodboardModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [referanceImageLoading] = useQueryState("loading", parseAsBoolean);
  const [refernceImage, setReferenceImage] = useQueryState(
    "scrollTo",
    parseAsString
  );
  const [, setScrollTo] = useQueryState("scrollTo");
  const refSection = useRef<HTMLDivElement | null>(null);

  // Scroll to reference section when needed
  useEffect(() => {
    if (refernceImage === "reference") {
      setTimeout(() => {
        refSection.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setScrollTo(null);
        setReferenceImage(null);
      }, 100);
    }
  }, [refernceImage, setScrollTo, setReferenceImage]);

  // Get all moodboards from all campaigns
  const getAllMoodboards = (): (MoodboardAsset & {
    campaignId: string;
    campaignTitle?: string;
  })[] => {
    if (!campaignInformation?.length) return [];

    return campaignInformation.flatMap((campaign) =>
      (campaign.moodboards || []).map((moodboard) => ({
        ...moodboard,
        campaignId: campaign.id,
        campaignTitle:
          campaign.campaign?.title || `Campaign ${campaign.id.slice(0, 8)}`,
      }))
    );
  };

  // Derived state functions - Primary source of truth
  const getCurrentMoodboard = ():
    | (MoodboardAsset & {
        campaignId: string;
        campaignTitle?: string;
      })
    | null => {
    // Show loading during updates
    if (isUpdating || referanceImageLoading) {
      return null;
    }

    // Prefer API data as source of truth
    if (a2iImageInformation?.reference_moodboard_id) {
      const allMoodboards = getAllMoodboards();
      const apiMoodboard = allMoodboards.find(
        (mb) => mb.id === a2iImageInformation.reference_moodboard_id
      );
      if (apiMoodboard) {
        return apiMoodboard;
      }
    }

    // Fallback to local state
    return selectedMoodboard as
      | (MoodboardAsset & {
          campaignId: string;
          campaignTitle?: string;
        })
      | null;
  };

  const getCurrentCampaign = (): ThreadCampaign | null => {
    // Show loading during updates
    if (isUpdating || referanceImageLoading) {
      return null;
    }

    // Prefer API data as source of truth
    if (a2iImageInformation?.reference_campaign_id) {
      const apiCampaign = campaignInformation?.find(
        (c) => c.id === a2iImageInformation.reference_campaign_id
      );
      if (apiCampaign) {
        return apiCampaign;
      }
    }

    // Fallback to local state
    return selectedCampaign;
  };

  // Sync local state with API data when available (for fallback scenarios)
  useEffect(() => {
    if (campaignInformation?.length && !isUpdating && !referanceImageLoading) {
      // Sync campaign
      if (a2iImageInformation?.reference_campaign_id) {
        const existingCampaign = campaignInformation.find(
          (c) => c.id === a2iImageInformation.reference_campaign_id
        );
        if (existingCampaign && existingCampaign.id !== selectedCampaign?.id) {
          setSelectedCampaign(existingCampaign);
        }
      }

      // Sync moodboard
      if (a2iImageInformation?.reference_moodboard_id) {
        const allMoodboards = getAllMoodboards();
        const existingMoodboard = allMoodboards.find(
          (mb) => mb.id === a2iImageInformation.reference_moodboard_id
        );
        if (
          existingMoodboard &&
          existingMoodboard.id !== selectedMoodboard?.id
        ) {
          setSelectedMoodboard(existingMoodboard);
        }
      }
    }
  }, [
    campaignInformation,
    a2iImageInformation,
    isUpdating,
    referanceImageLoading,
  ]);

  const handleMoodboardSelect = async (
    moodboard: MoodboardAsset & { campaignId: string }
  ) => {
    setIsUpdating(true);

    try {
      // Update API in parallel
      await Promise.all([
        updateReferenceMoodboardId(brandId, moodboard.id),
        updateReferenceCampaignId(brandId, moodboard.campaignId),
      ]);

      setIsMoodboardModalOpen(false);

      // Small delay to allow API response to be processed
      setTimeout(() => {
        setIsUpdating(false);
      }, 150);
    } catch (error) {
      console.error("Failed to update reference image:", error);
      setIsUpdating(false);
    }
  };

  const renderSelectedView = () => {
    const currentMoodboard = getCurrentMoodboard();
    const currentCampaign = getCurrentCampaign();

    // Show empty state when no selection
    if (
      !currentCampaign &&
      !currentMoodboard &&
      !isUpdating &&
      !referanceImageLoading
    ) {
      return (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Reference Selected</h3>
          <p className="text-muted-foreground mb-6">
            Select a moodboard to get started
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setIsMoodboardModalOpen(true)}
              disabled={getAllMoodboards().length === 0}
            >
              Select Moodboard
            </Button>
          </div>
        </div>
      );
    }

    // Show loading state
    if (
      referanceImageLoading ||
      isUpdating ||
      (!currentMoodboard && !currentCampaign)
    ) {
      return (
        <div>
          <div ref={refSection} className="absolute -top-5"></div>
          <div className="text-center py-16">
            <div className="relative">
              <Loader2 className="mx-auto h-12 w-12 mb-4 text-primary animate-spin" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full blur-xl -z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {referanceImageLoading
                  ? "Loading Reference Image"
                  : "Updating Selection"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Please wait while we process your reference selection...
              </p>
            </div>

            {/* Animated progress dots */}
            <div className="flex justify-center items-center gap-1 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Show content
    return (
      <div ref={refSection}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <MoodboardDisplayPanel
            selectedMoodboard={currentMoodboard}
            onOpenMoodboardModal={() => setIsMoodboardModalOpen(true)}
            onGoToGenerator={() => console.log("Navigate to generator")}
          />

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Moodboard Details */}
            <Card>
              <CardContent className="px-6 py-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Moodboard Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMoodboardModalOpen(true)}
                    disabled={isUpdating}
                  >
                    Change
                  </Button>
                </div>

                {currentMoodboard ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">
                        {currentMoodboard.asset_title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        From: {currentMoodboard.campaignTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {currentMoodboard.aspect_ratio}
                      </Badge>
                      <Badge variant="outline">
                        {currentMoodboard.media_format.toUpperCase()}
                      </Badge>
                    </div>

                    {currentMoodboard.comment && (
                      <div>
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentMoodboard.comment}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No moodboard selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Details */}
            <Card>
              <CardContent className="px-6 py-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Campaign Details</h3>
                </div>

                {currentCampaign ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">
                        {currentCampaign.campaign?.title ||
                          `Campaign ${currentCampaign.id.slice(0, 8)}`}
                      </h4>
                      {currentCampaign.campaign?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentCampaign.campaign.description}
                        </p>
                      )}
                    </div>

                    {currentCampaign.target_audience && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Target Audience</p>
                          <p className="text-sm text-muted-foreground">
                            {currentCampaign.target_audience}
                          </p>
                        </div>
                      </div>
                    )}

                    {currentCampaign.colors &&
                      currentCampaign.colors.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Palette className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Colors</p>
                            <div className="flex gap-1 mt-1">
                              {currentCampaign.colors.map((color, index) => (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    {currentCampaign.campaign?.tone &&
                      currentCampaign.campaign.tone.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Tone</p>
                          <div className="flex flex-wrap gap-1">
                            {currentCampaign.campaign.tone.map(
                              (tone, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tone}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No campaign selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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

    return renderSelectedView();
  };

  return (
    <>
      <ContentSection title="Reference Setup" content={renderContent()} />

      <MoodboardSelectionModal
        isOpen={isMoodboardModalOpen}
        onOpenChange={setIsMoodboardModalOpen}
        moodboards={getAllMoodboards()}
        selectedMoodboard={getCurrentMoodboard()}
        isUpdating={isUpdating}
        onSelect={handleMoodboardSelect}
        campaignInformation={getCurrentCampaign()}
      />
    </>
  );
}
