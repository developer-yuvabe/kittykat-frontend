"use client";

import { Button } from "@/components/ui/button";
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
import { Agents, AnalysisLogDetail } from "@/types/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Camera,
  ChevronRight,
  CirclePlus,
  Eye,
  Palette,
  Upload,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { DisplayField } from "../DisplayField";
import { BrandAestheticUploader } from "./BrandAestheticUploader";
import { BrandColors } from "./BrandColors";
import { BrandMedia } from "./BrandMedia";
import BrandSelector from "./BrandSelector";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";
import { useThreadStore } from "@/store/thread.store";
import BrandPersonas from "./BrandPersonas";
import { BrandPersona } from "@/types/persona.types";
import BrandBrainAnalysisResults from "./BrandBrainAnalysisResults";
import { BrandBrainAggregatedAnalysis } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { popVariants } from "@/lib/motion.utils";
import { AppConfig } from "@/config/app.config";

const BRAND_TABS = [
  {
    label: "Overview",
    value: "overview",
    icon: Eye,
  },
  {
    label: "Identity",
    value: "identity",
    icon: Palette,
  },
  {
    label: "Visual Style",
    value: "visual-style",
    icon: Camera,
  },
  {
    label: "Audience",
    value: "audience",
    icon: Users,
  },
  {
    label: "Sources",
    value: "sources",
    icon: Upload,
  },
];

export const BrandSection: React.FC<{
  brandingInformation: any;
  analysisLogs: AnalysisLogDetail[];
  brandId?: string;
  personas?: BrandPersona[];
  brandBrainAnalysis?: BrandBrainAggregatedAnalysis;
}> = ({ brandingInformation, analysisLogs, personas, brandBrainAnalysis }) => {
  const [expanded, setExpanded] = useState(
    AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW
  );
  const stream = useStreamContext();
  const { user } = useUserStore();
  const {
    setIsCreatingBrand,
    setSelectedBrandId,
    selectedBrandId,
    selectedCampaignId,
    selectedMoodboardId,
  } = useBrandStore();
  const { selectedImageGenerationModel, selectedVideoGenearationModel } =
    useModelsStore();
  const { chatOnlyMode } = useThreadStore();
  const { removePinnedItem } = usePinnedContextStore();

  const staticData = brandingInformation?.static;
  const dynamicData = brandingInformation?.dynamic;

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

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-x-4 items-center">
          <Button
            variant="outline"
            size="icon"
            className={
              expanded
                ? "rotate-90 transition-transform"
                : "transition-transform"
            }
            onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
          >
            {<ChevronRight />}
          </Button>
          <div className="w-14 h-14 rounded-lg bg-brand-gradient text-white flex items-center justify-center">
            <Building2 />
          </div>
          <div>
            <h4 className="font-light text-sm">Brand</h4>
            <p className="font-bold text-2xl">
              {brandingInformation?.static?.brand?.name || "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
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

      {/* Information */}
      {expanded && (
        <AnimatePresence>
          <motion.div
            initial="collapsed"
            animate="open"
            className="overflow-hidden"
            exit="collapsed"
            variants={popVariants}
          >
            <Tabs defaultValue={BRAND_TABS[0].value}>
              <TabsList>
                {BRAND_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-2">
                      <tab.icon className="size-4" />
                      {tab.label}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="mt-4">
                <TabsContent
                  value="overview"
                  className="grid grid-cols-2 gap-6"
                >
                  <div className="col-span-2">
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
                  </div>
                  <DisplayField
                    json={{
                      mission: staticData?.brand?.mission,
                    }}
                    key={"mission"}
                    title="Mission"
                    agentId={Agents.BRANDING_AGENT}
                    showKeyAsLabel={false}
                    onValueChange={(key, oldValue, newValue) => {
                      handleFieldUpdate(
                        `static.brand.${key}`,
                        oldValue,
                        newValue,
                        `Brand ${capitalizeKey(key)}`
                      );
                    }}
                  />
                  <DisplayField
                    json={{
                      vision: staticData?.brand?.vision,
                    }}
                    key="vision"
                    title="Vision"
                    agentId={Agents.BRANDING_AGENT}
                    showKeyAsLabel={false}
                    onValueChange={(key, oldValue, newValue) => {
                      handleFieldUpdate(
                        `static.brand.${key}`,
                        oldValue,
                        newValue,
                        `Brand ${capitalizeKey(key)}`
                      );
                    }}
                  />
                  <DisplayField
                    json={{
                      products: staticData?.products ?? [],
                    }}
                    key="products"
                    title="Products"
                    agentId={Agents.BRANDING_AGENT}
                    showKeyAsLabel={false}
                    onValueChange={(key, oldValue, newValue) => {
                      handleFieldUpdate(
                        `static.brand.${key}`,
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
                    key={capitalizeKey("target_audience")}
                    title="Target Audience"
                    agentId={Agents.BRANDING_AGENT}
                    showKeyAsLabel={false}
                    onValueChange={(key, oldValue, newValue) => {
                      handleFieldUpdate(
                        `static.${key}`,
                        oldValue,
                        newValue,
                        `Brand ${capitalizeKey(key)}`
                      );
                    }}
                  />

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
                </TabsContent>

                <TabsContent
                  value="identity"
                  className="grid grid-cols-1 gap-6"
                >
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
                </TabsContent>

                <TabsContent
                  value="visual-style"
                  className="grid grid-cols-1 gap-6"
                >
                  <BrandBrainAnalysisResults analysis={brandBrainAnalysis} />
                </TabsContent>

                <TabsContent
                  value="audience"
                  className="grid grid-cols-1 gap-6"
                >
                  <BrandPersonas personas={personas} />
                </TabsContent>

                <TabsContent value="sources" className="grid grid-cols-1 gap-6">
                  <BrandAestheticUploader
                    brandId={selectedBrandId}
                    socialMediaData={staticData?.social_media}
                    analysisLogs={analysisLogs ?? []}
                  />
                  <BrandMedia />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
