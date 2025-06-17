import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, CirclePlus, Check, X } from "lucide-react";
import { MdOutlineCampaign } from "react-icons/md";
import { DynamicContentSection } from "../DynamicSection";
import { Agents, ThreadDetails } from "@/types/types";
import { CampaignColors } from "./CampaignColors";
import { CampaignMoodboard } from "./CampaignMoodboards";
import { CampaignOverview } from "./CampaignOverview";
import CampaignSelector from "./CampaignSelector";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { motion } from "framer-motion";
import CampaignVisualStyleReferences from "./CampaignVisualStyleReferences";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ManualCampaignOverview } from "./ManualCampaignOverview";
import { createCampaign } from "@/services/api/campaign.service";
import VisualAestheticChooser, {
  generateMoodboardFromTags,
} from "./VisualAestheticChooser";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import ManualCampaignMoodboard, {
  ManualMoodboardItem,
} from "./ManualCampaignMoodboard";

interface ManualCampaignForm {
  title: string;
  description: string;
  tone: string[];
}

const INITIAL_MANUAL_FORM: ManualCampaignForm = {
  title: "",
  description: "",
  tone: [],
};

export const CampaignSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
}> = ({ campaignInformation, brandInformation }) => {
  // Early return for empty campaign information
  if (!campaignInformation?.length) return null;

  const { selectedBrandId } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  const latestCampaignIndex = useMemo(
    () => campaignInformation.length - 1,
    [campaignInformation.length]
  );

  const [expanded, setExpanded] = useState(true);
  const [selectedCampaignIndex, setSelectedCampaignIndex] =
    useState(latestCampaignIndex);
  const [fadeKey, setFadeKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [manualCampaignForm, setManualCampaignForm] =
    useState<ManualCampaignForm>(INITIAL_MANUAL_FORM);
  const [newToneInput, setNewToneInput] = useState("");

  const currentCampaign = useMemo(
    () => campaignInformation[selectedCampaignIndex],
    [campaignInformation, selectedCampaignIndex]
  );
  const dynamicData = useMemo(
    () => currentCampaign?.dynamic,
    [currentCampaign]
  );
  const isManualCampaign = useMemo(
    () => currentCampaign?.is_manual === true,
    [currentCampaign]
  );

  // Update selected index when campaign information changes
  useEffect(() => {
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(latestCampaignIndex);
  }, [latestCampaignIndex]);

  const resetManualForm = useCallback(() => {
    setManualCampaignForm(INITIAL_MANUAL_FORM);
    setNewToneInput("");
  }, []);

  const handleViaAgent = useCallback(() => {
    if (user) {
      submitOptimisticMessage({
        stream,
        text: `Let's create a new campaign!`,
        userId: user.id,
        currentBrandContextId: selectedBrandId,
      });
    }
    setOpen(false);
  }, [user, stream, selectedBrandId]);

  const handleManual = useCallback(() => {
    setIsCreatingManual(true);
    setOpen(false);
  }, []);

  const handleAddTone = useCallback(() => {
    const trimmedTone = newToneInput.trim();
    if (trimmedTone && !manualCampaignForm.tone.includes(trimmedTone)) {
      setManualCampaignForm((prev) => ({
        ...prev,
        tone: [...prev.tone, trimmedTone],
      }));
      setNewToneInput("");
    }
  }, [newToneInput, manualCampaignForm.tone]);

  const handleRemoveTone = useCallback((toneToRemove: string) => {
    setManualCampaignForm((prev) => ({
      ...prev,
      tone: prev.tone.filter((t) => t !== toneToRemove),
    }));
  }, []);

  const handleToneKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTone();
      }
    },
    [handleAddTone]
  );

  const handleSaveManualCampaign = useCallback(async () => {
    if (!manualCampaignForm.title.trim() && !selectedBrandId) {
      toast.error("Please enter a campaign title and select a brand.");
      return;
    }

    const newManualCampaign = {
      brand_id: selectedBrandId!,
      campaign: {
        title: manualCampaignForm.title,
        description: manualCampaignForm.description,
        tone: manualCampaignForm.tone,
      },
      is_manual: true,
    };
    if (selectedBrandId) {
      await createCampaign(selectedBrandId, newManualCampaign);
    }
    resetManualForm();
    setIsCreatingManual(false);
    toast.success("Campaign created successfully!");
  }, [manualCampaignForm, resetManualForm]);

  const handleCancelManualCreation = useCallback(() => {
    resetManualForm();
    setIsCreatingManual(false);
  }, [resetManualForm]);

  const handleManualCampaignSave = useCallback(
    (field: string, newValue: string | string[]) => {
      console.log(`Saving manual campaign ${field}:`, newValue);

      const updatePayload = {
        campaignId: currentCampaign.id,
        field: field,
        newValue: newValue,
        timestamp: new Date().toISOString(),
      };

      console.log("Would save to API:", updatePayload);
      toast.success(
        `Manual campaign ${field} updated successfully! Check console for details.`
      );
    },
    [currentCampaign?.id]
  );

  const handleCampaignIndexChange = useCallback((index: number) => {
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(index);
    setIsCreatingManual(false);
  }, []);

  const handleTitleSave = useCallback(
    async (newVal: string) => {
      if (isManualCampaign) {
        handleManualCampaignSave("title", newVal);
      } else {
        const oldVal = currentCampaign?.campaign?.title || "Unnamed Campaign";
        const msg = formatUpdateMessage(
          "campaign.title",
          oldVal,
          newVal,
          "campaignAgent",
          "Campaign Title"
        );
        if (msg && user) {
          submitOptimisticMessage({
            stream,
            text: msg,
            userId: user.id,
            currentBrandContextId: selectedBrandId,
          });
        }
      }
    },
    [
      isManualCampaign,
      handleManualCampaignSave,
      currentCampaign,
      user,
      stream,
      selectedBrandId,
    ]
  );

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);
  const togglePopover = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  const updateFormField = useCallback(
    (field: keyof ManualCampaignForm, value: string) => {
      setManualCampaignForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const isFormValid = useMemo(
    () => manualCampaignForm.title.trim().length > 0,
    [manualCampaignForm.title]
  );

  const [noOfImagesForMoodboard, setNoOfImagesForMoodboard] =
    useState<number>(10);

  const [manualMoodboardImages, setManualMoodboardImages] = useState<
    ManualMoodboardItem[]
  >([]);

  useEffect(() => {
    // if (isManualCampaign && currentCampaign?.moodboard) {
    //   setManualMoodboardImages(currentCampaign.moodboard);
    // }
  }, [isManualCampaign, currentCampaign]);

  const [isManualMoodboardGenerating, setIsManualMoodboardGenerating] =
    useState<boolean>(false);

  const handleGenerateMoodboard = async () => {
    if (!selectedBrandId || !currentCampaign.tags) return;

    await generateMoodboardFromTags(
      currentCampaign,
      selectedBrandId,
      setIsManualMoodboardGenerating,
      setManualMoodboardImages,
      noOfImagesForMoodboard
    );
  };
  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            {expanded ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            {!expanded ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MdOutlineCampaign size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Campaigns</div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your brand campaigns
                  </div>
                </div>
              </div>
            ) : (
              <div className="">
                {!isCreatingManual && (
                  <InlineEditableField
                    key={currentCampaign?.campaign?.title}
                    label="Campaign"
                    value={
                      currentCampaign?.campaign?.title || "Unnamed Campaign"
                    }
                    onSave={handleTitleSave}
                    textClassName="font-bold"
                    showLabel={true}
                    isTextarea={false}
                  />
                )}
              </div>
            )}
          </div>
          {expanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              <CampaignSelector
                campaigns={campaignInformation}
                selectedCampaignIndex={selectedCampaignIndex}
                setSelectedCampaignIndex={handleCampaignIndexChange}
              />
              {!isCreatingManual && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      size="lg"
                      className="p-4"
                      variant="ghost"
                      onClick={togglePopover}
                    >
                      <CirclePlus className="size-5" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent align="end" className="w-28 p-2">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={handleViaAgent}
                      >
                        Via Agent
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={handleManual}
                      >
                        Manual
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {isCreatingManual && (
                <div className="flex flex-row gap-x-2">
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveManualCampaign();
                    }}
                    disabled={!isFormValid}
                    className=""
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelManualCreation();
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <div>
          <CardContent>
            {/* Manual Campaign Creation Form */}
            {isCreatingManual && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 border-2 rounded-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold ">Create Campaign</h3>
                </div>

                <div className="space-y-4">
                  {/* Campaign Title */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="campaign-title"
                      className="text-sm font-medium"
                    >
                      Campaign Title *
                    </Label>
                    <Input
                      id="campaign-title"
                      value={manualCampaignForm.title}
                      onChange={(e) => updateFormField("title", e.target.value)}
                      placeholder="Enter campaign title..."
                      className="w-full"
                    />
                  </div>

                  {/* Campaign Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="campaign-description"
                      className="text-sm font-medium"
                    >
                      Campaign Description
                    </Label>
                    <Textarea
                      id="campaign-description"
                      value={manualCampaignForm.description}
                      onChange={(e) =>
                        updateFormField("description", e.target.value)
                      }
                      placeholder="Enter campaign description..."
                      className="w-full min-h-[80px]"
                    />
                  </div>

                  {/* Campaign Tone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Campaign Tone</Label>

                    {/* Existing tone badges */}
                    {manualCampaignForm.tone.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {manualCampaignForm.tone.map((tone, index) => (
                          <div
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {tone}
                            <button
                              onClick={() => handleRemoveTone(tone)}
                              className="text-blue-600 hover:text-blue-800"
                              type="button"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add tone input */}
                    <div className="flex gap-2">
                      <Input
                        value={newToneInput}
                        onChange={(e) => setNewToneInput(e.target.value)}
                        onKeyPress={handleToneKeyPress}
                        placeholder="Add tone (e.g., Professional, Friendly)"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddTone}
                        disabled={!newToneInput.trim()}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Existing campaign content */}
            {!isCreatingManual && (
              <motion.div
                key={fadeKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="pt-0 pb-6"
              >
                <div className="mt-1 space-y-6">
                  {isManualCampaign ? (
                    // Manual Campaign UI - Simplified with only overview

                    <>
                      <ManualCampaignOverview
                        title={currentCampaign?.campaign?.title}
                        description={currentCampaign?.campaign?.description}
                        tone={currentCampaign?.campaign?.tone}
                        campaignId={currentCampaign.id}
                        onSave={handleManualCampaignSave}
                      />
                      <VisualAestheticChooser
                        campaign={currentCampaign}
                        socialMediaPlatforms={
                          brandInformation?.static?.social_media
                        }
                        setIsManualMoodboardGenerating={
                          setIsManualMoodboardGenerating
                        }
                        isManualMoodboardGenerating={
                          isManualMoodboardGenerating
                        }
                        setManualMoodboardImages={setManualMoodboardImages}
                        manualMoodboardImages={manualMoodboardImages}
                        brandId={selectedBrandId || ""}
                        noOfImagesForMoodboard={noOfImagesForMoodboard}
                        handleGenerateMoodboard={handleGenerateMoodboard}
                      />
                      <ManualCampaignMoodboard
                        campaign={currentCampaign}
                        brandId={selectedBrandId!}
                        noOfImagesForMoodboard={noOfImagesForMoodboard}
                        setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                        isGenerating={isManualMoodboardGenerating}
                        moodboard={manualMoodboardImages}
                        handleGenerateMoodboard={handleGenerateMoodboard}
                      />
                      {currentCampaign?.visual_style_references && (
                        <CampaignVisualStyleReferences
                          visualStyleReferences={
                            currentCampaign.visual_style_references
                          }
                          hideImages
                        />
                      )}
                    </>
                  ) : (
                    // Agent-based Campaign UI - Full features
                    <>
                      <CampaignOverview
                        title={currentCampaign?.campaign?.title}
                        description={currentCampaign?.campaign?.description}
                        tone={currentCampaign?.campaign?.tone}
                        campaignId={currentCampaign.id}
                      />
                      <CampaignColors
                        colors={currentCampaign?.colors || []}
                        campaignId={currentCampaign.id}
                        campaignTitle={currentCampaign.campaign?.title}
                      />
                      <CampaignVisualStyleReferences
                        visualStyleReferences={
                          currentCampaign.visual_style_references
                        }
                      />

                      <DynamicContentSection
                        dynamicData={dynamicData ?? {}}
                        agentId={Agents.CAMPAIGN_AGENT}
                      />

                      <CampaignMoodboard
                        currentCampaign={currentCampaign}
                        brandId={selectedBrandId!}
                        campaignId={currentCampaign.id}
                        brandInformation={brandInformation}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
};
