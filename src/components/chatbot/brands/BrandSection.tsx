"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  capitalizeKey,
  extractAllColors,
  formatUpdateMessage,
  normalizeJsonToString,
} from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { useUserStore } from "@/store/user.store";
import { Agents, AnalysisLogDetail, ThreadBrand } from "@/types/types";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronUp, CirclePlus } from "lucide-react";
import React from "react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { DisplayField } from "../DisplayField";
import { BrandAestheticUploader } from "./BrandAestheticUploader";
import { BrandColors } from "./BrandColors";
import { BrandMedia } from "./BrandMedia";
import BrandSelector from "./BrandSelector";
import { InitialPlaceHolder } from "./InitialPlaceHolder";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";
import { useThreadStore } from "@/store/thread.store";
import BrandPersonas from "./BrandPersonas";
import { BrandPersona } from "@/types/persona.types";
import BrandBrainAnalysisResults from "./BrandBrainAnalysisResults";
import { BrandBrainAggregatedAnalysis } from "@/types/types";

export const BrandSection: React.FC<{
  brandingInformation: any;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  analysisLogs: AnalysisLogDetail[];
  brandId?: string;
  personas?: BrandPersona[];
  brandBrainAnalysis?: BrandBrainAggregatedAnalysis;
}> = ({
  brandingInformation,
  expandedSections,
  setExpandedSections,
  analysisLogs,
  brandId,
  personas,
  brandBrainAnalysis,
}) => {
  const { selectedBrandId } = useBrandStore();
  const effectiveBrandId = brandId || selectedBrandId;

  if (!brandingInformation) {
    return <InitialPlaceHolder />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {renderBrandData(
          expandedSections,
          (section) =>
            setExpandedSections((prev) => ({
              ...prev,
              [section]: !prev[section],
            })),
          brandingInformation.static,
          brandingInformation.dynamic,
          brandingInformation.brand_media,
          analysisLogs,
          effectiveBrandId ?? undefined,
          personas,
          brandBrainAnalysis
        )}
      </div>
    </div>
  );
};

export const renderBrandData = (
  expandedSections: { [key: string]: boolean },
  toggleSection: (section: string) => void,
  staticData: ThreadBrand["static"],
  dynamicData: ThreadBrand["dynamic"],
  brandMedia: any,
  analysisLogs: AnalysisLogDetail[],
  brandId?: string,
  personas?: BrandPersona[],
  brandBrainAnalysis?: BrandBrainAggregatedAnalysis
) => {
  const brandInitial = (staticData?.brand?.name || "No Brand Name")
    .charAt(0)
    .toUpperCase();
  const [showDynamicData, setShowDynamicData] = React.useState(false);
  const stream = useStreamContext();
  const { user } = useUserStore();
  const {
    selectedBrandId,
    setIsCreatingBrand,
    setSelectedBrandId,
    selectedCampaignId,
    selectedMoodboardId,
  } = useBrandStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const { chatOnlyMode } = useThreadStore();
  const { removePinnedItem } = usePinnedContextStore();

  const handleFieldUpdate = async (
    fieldPath: string,
    oldValue: any,
    newVal: any,
    label?: string
  ) => {
    const msg = formatUpdateMessage(
      fieldPath,
      normalizeJsonToString(oldValue),
      normalizeJsonToString(newVal),
      Agents.BRANDING_AGENT,
      label ??
        fieldPath
          .split(".")
          .pop()
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
    );

    if (msg) {
      submitOptimisticMessage({
        stream,
        text: msg,
        userId: user!.id,
        chatOnlyMode,
        currentBrandContextId: selectedBrandId,
        currentCampaignId: selectedCampaignId,
        currentMoodboardId: selectedMoodboardId,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        currentSelectedVideoGenerationModelId:
          selectedVideoGenearationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        activeTeamId: user!.active_team_id!,
      });
    }
  };

  // Enhanced function to handle new brand creation with scroll
  const handleNewBrandCreation = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      // Set creating brand state
      setIsCreatingBrand(true);

      setSelectedBrandId(null);
      // Submit the message
      submitOptimisticMessage({
        stream,
        text: "Let's create a new brand.",
        userId: user!.id,
        chatOnlyMode,
        currentBrandContextId: null,
        currentCampaignId: null,
        currentMoodboardId: null,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        currentSelectedVideoGenerationModelId:
          selectedVideoGenearationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
        activeTeamId: user!.active_team_id!,
      });

      // Clear pinned items
      removePinnedItem();
    } catch (error) {
      console.error("Error creating new brand:", error);
    }
  };

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection("brandOverview")}
        >
          <div className="flex items-center">
            {expandedSections.brandOverview ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}

            {!expandedSections.brandOverview ? (
              <div className="flex items-center ">
                <Avatar className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  <AvatarImage src={""} alt="@shadcn" />
                  <AvatarFallback className="bg-blue-500">
                    <span className="text-white font-bold">{brandInitial}</span>
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <div className="text-sm font-medium">
                    {staticData?.brand?.name
                      ? `Brand: ${staticData?.brand?.name}`
                      : "Brand Information"}
                  </div>
                  <div className="text-xs text-[#6e7787]">
                    Set up, switch, and modify your Brand
                  </div>
                  <div className="absolute right-3 top-7">
                    <div className="flex justify-between items-center gap-x-2">
                      <div>
                        <BrandSelector />
                      </div>
                      <TooltipIconButton
                        size="lg"
                        className="p-4"
                        tooltip="New Brand"
                        variant="ghost"
                        onClick={handleNewBrandCreation} // Use enhanced function
                      >
                        <CirclePlus className="size-5" />
                      </TooltipIconButton>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Avatar className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  <AvatarImage src={""} alt="@shadcn" />
                  <AvatarFallback className="bg-blue-500">
                    <span className="text-white font-bold">{brandInitial}</span>
                  </AvatarFallback>
                </Avatar>
                <DisplayField
                  json={{ Brand: `${staticData?.brand?.name}` }}
                  agentId={Agents.BRANDING_AGENT}
                  onValueChange={(key, oldValue, newValue) => {
                    handleFieldUpdate(
                      `static.brand.Name`,
                      oldValue,
                      newValue,
                      `Brand Name`
                    );
                  }}
                />

                <div className="absolute right-3 top-7">
                  <div className="flex justify-between items-center gap-x-2">
                    <div>
                      <BrandSelector />
                    </div>
                    <TooltipIconButton
                      size="lg"
                      className="p-4"
                      tooltip="New Brand"
                      variant="ghost"
                      onClick={handleNewBrandCreation} // Use enhanced function
                    >
                      <CirclePlus className="size-5" />
                    </TooltipIconButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {expandedSections.brandOverview && (
        <CardContent className="pt-0 pb-6">
          <div className="mt-1 space-y-6">
            <DisplayField
              json={{
                tagline: staticData?.brand?.tagline,
                values: staticData?.brand?.values,
              }}
              title="Brand Overview"
              agentId={Agents.BRANDING_AGENT}
              showKeyAsLabel
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.brand.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              specialInstruction={`
    Please update only the fields "tagline" and/or "values".
    The user may refer to the update vaguely (for example, "Brand Overview") or may not explicitly mention the field name.
    In such cases, infer whether the update applies to "tagline", "values", or both, and update them accordingly.
    Never update any other fields.
  `}
            />

            <DisplayField
              json={{
                mission: staticData?.brand?.mission,
                vision: staticData?.brand?.vision,
              }}
              title="Brand Purpose"
              agentId={Agents.BRANDING_AGENT}
              showKeyAsLabel
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.brand.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
            />

            <BrandColors colors={extractAllColors(staticData)} />

            <DisplayField
              json={{
                primary_font: {
                  name: staticData?.typography?.primaryFont?.name,
                  weights: staticData?.typography?.primaryFont?.weights,
                },
                secondary_font: {
                  name: staticData?.typography?.secondaryFont?.name,
                  weights: staticData?.typography?.secondaryFont?.weights,
                },
              }}
              title="Brand Typography"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key.split(".").join(" "))}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={staticData?.photography || {}}
              title="Photography"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={staticData?.lighting || {}}
              title="Lighting"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={staticData?.styling || {}}
              title="Styling"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={staticData?.casting || {}}
              title="Casting"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={staticData?.setting || {}}
              title="Setting"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
              showKeyAsLabel
            />

            <DisplayField
              json={{
                products: staticData?.products || [],
              }}
              title="Products"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
            />

            <DisplayField
              json={{
                target_audience: staticData?.target_audience,
              }}
              title="Target Audience"
              agentId={Agents.BRANDING_AGENT}
              onValueChange={(key, oldValue, newValue) => {
                handleFieldUpdate(
                  `static.${key}`,
                  oldValue,
                  newValue,
                  `Brand ${capitalizeKey(key)}`
                );
              }}
            />
            <div className="pt-2">
              <BrandBrainAnalysisResults analysis={brandBrainAnalysis} />
            </div>

            <div className="pt-2">
              <BrandPersonas personas={personas} />
            </div>

            {/* Brand Media Upload Section */}
            <BrandAestheticUploader
              brandId={selectedBrandId}
              socialMediaData={staticData?.social_media}
              analysisLogs={analysisLogs ?? []}
            />
            <BrandMedia />

            <AnimatePresence>
              {showDynamicData && (
                <motion.div
                  key="dynamic-section"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                  transition={{ duration: 0.1 }}
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 5 },
                  }}
                >
                  {Object.keys(dynamicData || {}).length === 0 && (
                    <div className="text-sm italic text-gray-400">
                      No dynamic details available.
                    </div>
                  )}

                  {Object.keys(dynamicData || {}).map((key, idx) => (
                    <DisplayField
                      key={idx}
                      json={{ [key]: dynamicData ? dynamicData[key] : null }}
                      title={capitalizeKey(key)}
                      agentId={Agents.BRANDING_AGENT}
                      onValueChange={(subKey, oldValue, newValue) => {
                        handleFieldUpdate(
                          `dynamic.${key}`,
                          oldValue,
                          newValue,
                          `Brand ${capitalizeKey(key)}`
                        );
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={() => {
                setShowDynamicData(!showDynamicData);
              }}
              className="text-primary underline  cursor-pointer h-max w-max hover:bg-transparent p-0 flex ml-auto"
              variant="ghost"
            >
              {showDynamicData ? <ChevronUp /> : <ChevronDown />}
              {showDynamicData ? " Less details" : "More details"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
