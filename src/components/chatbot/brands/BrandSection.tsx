import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractAllColors, formatUpdateMessage } from "@/lib/langgraph.utils";
import { ChevronDown, ChevronRight, ChevronUp, CirclePlus } from "lucide-react";
import React from "react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { BrandColors } from "./BrandColors";
import { BrandMedia } from "./BrandMedia";
import { BrandOverview } from "./BrandOverview";
import BrandSelector from "./BrandSelector";
import { BrandTargetAudience } from "./BrandTargetAudience";
import { Agents, ThreadBrand } from "@/types/types";
import { BrandProducts } from "./BrandProducts";
import { BrandTypography } from "./BrandTypography";
import BrandPurpose from "./BrandPurpose";
import { BrandPhotography } from "./BrandPhotography";
import { BrandLighting } from "./BrandLightning";
import { BrandStyling } from "./BrandStyling";
import { BrandCasting } from "./BrandCasting";
import { BrandSetting } from "./BrandSetting";
import { Button } from "@/components/ui/button";
import { DynamicContentSection } from "../DynamicSection";
import { AnimatePresence, motion } from "framer-motion";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useStreamContext } from "@/providers/langgraph/Stream";
import InitialPlaceHolder from "./InitialPlaceHolder";

export const BrandSection: React.FC<{
  brandingInformation: any;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  clearPinnedItems: () => void;
}> = ({
  brandingInformation,
  expandedSections,
  setExpandedSections,
  clearPinnedItems,
}) => {
  if (!brandingInformation) return <InitialPlaceHolder />;

  return (
    <div className="flex flex-col gap-4">
      <div key={`brand-message-${brandingInformation?.static?.name}`}>
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
          clearPinnedItems
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
  clearPinnedItems: () => void
) => {
  try {
    const brandName = staticData?.brand?.name || "No Brand Name";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const allColors = extractAllColors(staticData);
    const [showDynamicData, setShowDynamicData] = React.useState(false);
    const stream = useStreamContext();

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
                      <span className="text-white font-bold">
                        {brandInitial}
                      </span>
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
                    <div className="absolute right-3 top-6 ">
                      <div className="flex justify-between gap-x-2">
                        <div>
                          <BrandSelector />
                        </div>
                        <TooltipIconButton
                          size="lg"
                          className="p-4"
                          tooltip="New Brand"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearPinnedItems();
                          }}
                        >
                          <CirclePlus className="size-5" />
                        </TooltipIconButton>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className=""
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <InlineEditableField
                    key={staticData?.brand?.name}
                    label="Brand"
                    value={staticData?.brand?.name || ""}
                    onSave={async (newVal) => {
                      const oldVal = staticData?.brand?.name || "";
                      const msg = formatUpdateMessage(
                        "staticData.brand.name",
                        oldVal,
                        newVal,
                        "brandingAgent",
                        "Brand Name"
                      );
                      if (msg) {
                        submitOptimisticMessage({
                          stream,
                          text: msg,
                        });
                      }
                    }}
                    textClassName="font-bold"
                    showLabel={true}
                    isTextarea={false}
                  />

                  <div className="absolute right-3 top-6 ">
                    <div className="flex justify-between gap-x-2">
                      <div>
                        <BrandSelector />
                      </div>
                      <TooltipIconButton
                        size="lg"
                        className="p-4"
                        tooltip="New Brand"
                        variant="ghost"
                        onClick={() => {
                          clearPinnedItems();
                        }}
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
          <CardContent className="pt-0  pb-6">
            <div className="mt-1 space-y-6">
              <BrandOverview
                tagline={staticData?.brand?.tagline}
                values={staticData?.brand?.values}
                name={staticData?.brand?.name}
              />

              <BrandPurpose
                mission={staticData?.brand?.mission}
                vision={staticData?.brand?.vision}
              />

              <BrandColors colors={allColors} />

              <BrandTypography
                primaryFont={staticData?.typography?.primaryFont}
                secondaryFont={staticData?.typography?.secondaryFont}
              />

              <BrandPhotography {...staticData?.photography} />
              <BrandLighting {...staticData?.lighting} />
              <BrandStyling {...staticData?.styling} />
              <BrandCasting {...staticData?.casting} />
              <BrandSetting {...staticData?.setting} />

              <BrandProducts products={staticData?.products || []} />

              <BrandTargetAudience
                targetAudience={staticData?.target_audience}
              />

              <BrandMedia
                socialMedia={staticData?.social_media}
                brandMedia={brandMedia}
              />

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
                    <DynamicContentSection
                      dynamicData={dynamicData ?? {}}
                      agentId={Agents.BRANDING_AGENT}
                    />
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
  } catch (error) {
    console.error("Error parsing brand data:", error);
    return (
      <Card className="bg-gray-50">
        <CardHeader className="">
          <CardTitle className="text-xl font-semibold text-primary">
            <div className="flex justify-between">
              <div>No brand found</div>
              <BrandSelector />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <p className="text-sm text-gray-500">
            No brand information is currently available.
          </p>
        </CardContent>
      </Card>
    );
  }
};
