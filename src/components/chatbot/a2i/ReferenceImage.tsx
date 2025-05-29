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

import { CheckCircle, Image, Target, Palette, Users, Eye } from "lucide-react";
import { MoodboardAsset, ThreadA2iImage, ThreadCampaign } from "@/types/types";
import {
  updateReferenceCampaignId,
  updateReferenceMoodboardId,
} from "@/hooks/useParameterManagement";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [selectedMoodboard, setSelectedMoodboard] =
    useState<MoodboardAsset | null>(null);
  const [selectedCampaign, setSelectedCampaign] =
    useState<ThreadCampaign | null>(null);
  const [isMoodboardModalOpen, setIsMoodboardModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Initialize with existing references
  useEffect(() => {
    if (campaignInformation?.length) {
      // Set existing reference campaign if available
      if (a2iImageInformation?.reference_campaign_id) {
        const existingCampaign = campaignInformation.find(
          (c) => c.id === a2iImageInformation.reference_campaign_id
        );
        if (existingCampaign) {
          setSelectedCampaign(existingCampaign);
        }
      }

      // Set existing reference moodboard if available
      if (a2iImageInformation?.reference_moodboard_id) {
        const allMoodboards = getAllMoodboards();
        const existingMoodboard = allMoodboards.find(
          (mb) => mb.id === a2iImageInformation.reference_moodboard_id
        );
        if (existingMoodboard) {
          setSelectedMoodboard(existingMoodboard);
          // Also set the campaign if not already set
          if (!selectedCampaign) {
            const campaign = campaignInformation.find(
              (c) => c.id === existingMoodboard.campaignId
            );
            if (campaign) {
              setSelectedCampaign(campaign);
            }
          }
        }
      }
    }
  }, [campaignInformation, a2iImageInformation]);

  const handleCampaignSelect = async (campaign: ThreadCampaign) => {
    setIsUpdating(true);
    try {
      await updateReferenceCampaignId(brandId, campaign.id);
      setSelectedCampaign(campaign);
      setIsCampaignModalOpen(false);
    } catch (error) {
      console.error("Failed to update campaign selection:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMoodboardSelect = async (
    moodboard: MoodboardAsset & { campaignId: string }
  ) => {
    setIsUpdating(true);
    try {
      await updateReferenceMoodboardId(brandId, moodboard.id);
      setSelectedMoodboard(moodboard);

      // Auto-select the campaign if not already selected or different
      if (!selectedCampaign || selectedCampaign.id !== moodboard.campaignId) {
        const campaign = campaignInformation?.find(
          (c) => c.id === moodboard.campaignId
        );
        if (campaign) {
          await updateReferenceCampaignId(brandId, campaign.id);
          setSelectedCampaign(campaign);
        }
      }

      setIsMoodboardModalOpen(false);
    } catch (error) {
      console.error("Failed to update reference image:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSelectedView = () => {
    if (!selectedCampaign && !selectedMoodboard) {
      return (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Reference Selected</h3>
          <p className="text-muted-foreground mb-6">
            Select a campaign and moodboard to get started
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setIsCampaignModalOpen(true)}
              disabled={!campaignInformation?.length}
            >
              Select Campaign
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsMoodboardModalOpen(true)}
              disabled={getAllMoodboards().length === 0}
            >
              Select Moodboard
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
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
                    onClick: () => console.log("Navigate to generator"),

                    color: "#EA916E",
                    hoverColor: "#e7845d",
                  },
                  {
                    label: "Select Board",
                    onClick: () => setIsMoodboardModalOpen(true),

                    hoverColor: "#5b5fd1",
                    color: "#636AE8",
                  },
                ]}
                className="flex justify-between 2xl:mx-8"
              />
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-muted-foreground mb-4">
                No moodboard selected
              </p>
              <Button onClick={() => setIsMoodboardModalOpen(true)}>
                Select Moodboard
              </Button>
            </div>
          )}
        </div>

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
                >
                  Change
                </Button>
              </div>

              {selectedMoodboard ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">
                      {selectedMoodboard.asset_title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      From: {(selectedMoodboard as any).campaignTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {selectedMoodboard.aspect_ratio}
                    </Badge>
                    <Badge variant="outline">
                      {selectedMoodboard.media_format.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedMoodboard.comment && (
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedMoodboard.comment}
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

              {selectedCampaign ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {selectedCampaign.campaign?.title ||
                        `Campaign ${selectedCampaign.id.slice(0, 8)}`}
                    </h4>
                    {selectedCampaign.campaign?.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCampaign.campaign.description}
                      </p>
                    )}
                  </div>

                  {selectedCampaign.target_audience && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Target Audience</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCampaign.target_audience}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCampaign.visual_style && (
                    <div className="flex items-start gap-2">
                      <Eye className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Visual Style</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCampaign.visual_style}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCampaign.colors &&
                    selectedCampaign.colors.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Palette className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Colors</p>
                          <div className="flex gap-1 mt-1">
                            {selectedCampaign.colors.map((color, index) => (
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

                  {selectedCampaign.campaign?.tone &&
                    selectedCampaign.campaign.tone.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Tone</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedCampaign.campaign.tone.map((tone, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tone}
                            </Badge>
                          ))}
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

      {/* Campaign Selection Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Campaign</DialogTitle>
          </DialogHeader>

          {campaignInformation?.length ? (
            <div className="space-y-3">
              {campaignInformation.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCampaign?.id === campaign.id
                      ? "ring-2 ring-primary"
                      : ""
                  } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleCampaignSelect(campaign)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {campaign.campaign?.title ||
                            `Campaign ${campaign.id.slice(0, 8)}`}
                        </h4>
                        {campaign.campaign?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {campaign.campaign.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {campaign.moodboards && (
                            <span className="text-xs text-muted-foreground">
                              {campaign.moodboards.length} moodboard
                              {campaign.moodboards.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {campaign.target_audience && (
                            <span className="text-xs text-muted-foreground">
                              {campaign.target_audience}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedCampaign?.id === campaign.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No campaigns available</p>
            </div>
          )}

          {isUpdating && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Updating campaign...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moodboard Selection Modal */}
      <Dialog
        open={isMoodboardModalOpen}
        onOpenChange={setIsMoodboardModalOpen}
      >
        <DialogContent className="sm:w-lg md:min-w-4xl lg:min-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Reference Moodboard</DialogTitle>
          </DialogHeader>

          {getAllMoodboards().length ? (
            <Carousel className="w-full mt-4">
              <CarouselContent>
                {getAllMoodboards().map((moodboard, index) => (
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
                      onClick={() => handleMoodboardSelect(moodboard)}
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
                            {moodboard.asset_title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {moodboard.campaignTitle}
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
    </>
  );
}
