import { ContentSection } from "@/components/shared/ContentSection";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import {
  MoodboardInformation,
  ThreadA2iImage,
  ThreadCampaign,
  ThreadDetails,
} from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState, useCallback, RefObject } from "react";
import { toast } from "sonner";
import { useA2iStore } from "@/store/a2i.store";
import { updateA2iRefernceMoodboard } from "@/services/api/a2i.service";
import { useReferenceMoodboardData } from "./ReferenceMoodboardData.hook";
import { ReferenceMoodboardHeader } from "./ReferenceMoodboardHeader";
import { ReferenceMoodboardGallery } from "./ReferenceMoodboardGallery";
import { ReferenceMoodboardPrompts } from "./ReferenceMoodboardPrompts";
import { ReferenceMoodboardEmpty } from "./ReferenceMoodboardEmpty";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  referenceMoodboardAssets: ThreadA2iImage["reference_moodboard_assets"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
  currentCampaign: ThreadCampaign | null;
  showPrompts?: boolean;
  showBorder?: boolean;
  isAdvanceMode?: boolean;
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  referenceMoodboardAssets: referenceMoodboardAssetsProp,
  prompts,
  moodboardInformation,
  formRef,
  currentCampaign,
  showPrompts = true,
  showBorder = false,
  isAdvanceMode = false,
}: ReferenceMoodboardProps) => {
  const { setReferencePrompt, isGeneratingPrompts, setIsGeneratingPrompts } =
    useA2iStore();
  const {
    setCampaignMoodboardSelection,
    setSelectedMoodboardId,
    setSelectedCampaignId,
    selectedBrandId,
  } = useBrandStore();

  const [n, setN] = useState<number | "">(prompts?.length || "");
  const [isSwitchingReferenceMoodboard, setIsSwitchingReferenceMoodboard] =
    useState(false);

  // Use custom hook for data fetching
  const {
    items,
    setItems,
    loading,
    isBulkLoading,
    isBulkFetching,
    selectedMoodboard,
    noOfImagesForMoodboard,
  } = useReferenceMoodboardData(
    referenceMoodboardId || null,
    referenceMoodboardAssetsProp || null,
    moodboardInformation
  );

  const { mutate: generateShowboard } = useMutation({
    mutationFn: ({
      brandId,
      moodboardId,
      numberOfPrompts,
      referenceMoodboardAssets,
    }: {
      brandId: string;
      moodboardId: string;
      numberOfPrompts: number;
      referenceMoodboardAssets?: any[];
    }) =>
      generateA2iShowboard(
        brandId,
        moodboardId,
        referenceMoodboardAssets,
        numberOfPrompts
      ),
    onMutate: () => {
      setIsGeneratingPrompts(true);
    },
    onSuccess: () => {
      toast.success("Concept Visual prompts generated successfully!");
    },
    onError: () => {
      toast.error(
        "Failed to generate concept Visual prompts. Please try again."
      );
      setIsGeneratingPrompts(false);
    },
  });

  useEffect(() => {
    if (prompts && prompts.length > 0) {
      setN(prompts.length);
    }

    if (isSwitchingReferenceMoodboard) return;

    if (isGeneratingPrompts) {
      setIsGeneratingPrompts(false);
    }
  }, [prompts]);

  // Handle the case where the reference moodboard is deleted
  useEffect(() => {
    if (
      referenceMoodboardId &&
      moodboardInformation &&
      !selectedMoodboard &&
      selectedBrandId
    ) {
      setSelectedMoodboardId(null);
      const timeoutId = setTimeout(() => {
        updateA2iRefernceMoodboard(selectedBrandId, null);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    referenceMoodboardId,
    selectedMoodboard?.id,
    moodboardInformation?.length,
    selectedBrandId,
    setSelectedMoodboardId,
  ]);

  // Clear switching state after backend confirms the new reference moodboard
  useEffect(() => {
    setIsSwitchingReferenceMoodboard(false);
  }, [referenceMoodboardId, referenceMoodboardAssetsProp]);

  // Handle moodboard selection change
  const handleMoodboardSelectionChange = useCallback(
    async (moodboard: MoodboardInformation | null) => {
      try {
        setIsSwitchingReferenceMoodboard(true);
        if (!moodboard) {
          setSelectedMoodboardId(null);
          setSelectedCampaignId(null);
          if (selectedBrandId) {
            await updateA2iRefernceMoodboard(selectedBrandId, null, []);
          }
          return;
        }

        if (moodboard.campaign_id) {
          setSelectedCampaignId(moodboard.campaign_id);

          setTimeout(() => {
            setSelectedMoodboardId(moodboard.id);
          }, 1000);
        }

        // In advanced mode: update reference moodboard only
        // In normal mode: generate prompts
        if (selectedBrandId && moodboard.id) {
          if (isAdvanceMode) {
            await updateA2iRefernceMoodboard(
              selectedBrandId,
              moodboard.id,
              moodboard.moodboard_assets
            );
          } else {
            // Normal mode: generate prompts
            if (!isGeneratingPrompts) {
              generateShowboard({
                brandId: selectedBrandId,
                moodboardId: moodboard.id,
                referenceMoodboardAssets: moodboard.moodboard_assets,
                numberOfPrompts: Number(n) || 1,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error in handleMoodboardSelectionChange:", error);
      }
    },
    [
      selectedBrandId,
      setCampaignMoodboardSelection,
      setSelectedMoodboardId,
      setSelectedCampaignId,
      generateShowboard,
      n,
      isGeneratingPrompts,
      isAdvanceMode,
    ]
  );

  const handleGeneratePrompts = useCallback(
    (numberOfPrompts: number) => {
      if (selectedBrandId && referenceMoodboardId) {
        generateShowboard({
          brandId: selectedBrandId,
          moodboardId: referenceMoodboardId,
          referenceMoodboardAssets: referenceMoodboardAssetsProp || [],
          numberOfPrompts,
        });
      }
    },
    [
      selectedBrandId,
      referenceMoodboardId,
      referenceMoodboardAssetsProp,
      generateShowboard,
    ]
  );

  const handleEditPrompt = useCallback(
    (prompt: string) => {
      setReferencePrompt(prompt);
    },
    [setReferencePrompt]
  );

  // Check if moodboard is deleted or not available
  const isMoodboardDeleted =
    referenceMoodboardId === null ||
    (!selectedMoodboard && referenceMoodboardId);

  return (
    <ContentSection
      title="Reference Moodboard"
      showCopy={false}
      showBorder={showBorder}
      showPin={false}
      context={{ data: {} }}
      content={
        <div className="space-y-8">
          {isMoodboardDeleted ? (
            <ReferenceMoodboardEmpty
              moodboardInformation={moodboardInformation}
              currentCampaign={currentCampaign}
              onMoodboardChange={handleMoodboardSelectionChange}
            />
          ) : (
            <>
              <ReferenceMoodboardHeader
                selectedMoodboard={selectedMoodboard}
                moodboardInformation={moodboardInformation}
                isSwitching={isSwitchingReferenceMoodboard}
                onMoodboardChange={handleMoodboardSelectionChange}
              />

              <ReferenceMoodboardGallery
                items={items}
                setItems={setItems}
                selectedMoodboard={selectedMoodboard}
                loading={loading}
                isBulkLoading={isBulkLoading}
                isBulkFetching={isBulkFetching}
                isSwitching={isSwitchingReferenceMoodboard}
                noOfImagesForMoodboard={noOfImagesForMoodboard}
              />
              {showPrompts && (
                <ReferenceMoodboardPrompts
                  prompts={prompts || null}
                  n={n}
                  setN={setN}
                  selectedMoodboard={selectedMoodboard}
                  referenceMoodboardId={referenceMoodboardId || null}
                  isGenerating={isGeneratingPrompts}
                  onGenerate={handleGeneratePrompts}
                  onEditPrompt={handleEditPrompt}
                  formRef={formRef}
                />
              )}
            </>
          )}
        </div>
      }
    />
  );
};

export default ReferenceMoodboard;
