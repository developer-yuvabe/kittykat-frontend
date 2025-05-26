import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractAllColors } from "@/lib/langgraph.utils";
import { ChevronDown, ChevronRight, CirclePlus } from "lucide-react";
import React from "react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { BrandColors } from "./BrandColors";
import { BrandMedia } from "./BrandMedia";
import { BrandOverview } from "./BrandOverview";
import BrandSelector from "./BrandSelector";
import { BrandTargetAudience } from "./BrandTargetAudience";

export const BrandSection: React.FC<{
  brandingInformation: any;
  setThreadId: (id: string | null) => void;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  clearPinnedItems: () => void;
}> = ({
  brandingInformation,
  setThreadId,
  expandedSections,
  setExpandedSections,
  clearPinnedItems,
}) => {
  if (!brandingInformation)
    return (
      <div className="p-4">
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">
              <div className="flex justify-between">
                <div>No brand found</div>
                <BrandSelector setThreadId={setThreadId} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              No brand information is currently available. Start chatting with
              the{" "}
              <span className="font-semibold text-primary">Kittykat agent</span>{" "}
              to onboard your brand.
            </p>
          </CardContent>
        </Card>
      </div>
    );

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
          setThreadId,
          brandingInformation.static,
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
  setThreadId: (id: string | null) => void,
  staticData: any,
  brandMedia: any,
  clearPinnedItems: () => void
) => {
  try {
    const brandName = staticData?.brand?.name || "No Brand Name";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const allColors = extractAllColors(staticData);

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
                    <AvatarImage src={staticData.logos[0]} alt="@shadcn" />
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
                          <BrandSelector setThreadId={setThreadId} />
                        </div>
                        <TooltipIconButton
                          size="lg"
                          className="p-4"
                          tooltip="New Brand"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreadId(null);
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
                <div className="">
                  <div className="font-bold ">
                    Brand: {staticData?.brand?.name}
                  </div>
                  <div className="absolute right-3 top-6 ">
                    <div className="flex justify-between gap-x-2">
                      <div>
                        <BrandSelector setThreadId={setThreadId} />
                      </div>
                      <TooltipIconButton
                        size="lg"
                        className="p-4"
                        tooltip="New Brand"
                        variant="ghost"
                        onClick={() => {
                          setThreadId(null);
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
              {/* Brand Section */}
              <BrandOverview
                tagline={staticData?.brand?.tagline}
                values={staticData?.brand?.values}
                name={staticData?.brand?.name}
              />

              {/* Target Audience */}
              <BrandTargetAudience
                targetAudience={staticData?.target_audience}
              />

              {/* Colors Section */}
              <BrandColors colors={allColors} />

              {/* Media Section */}
              <BrandMedia
                socialMedia={staticData?.social_media}
                brandMedia={brandMedia}
              />
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
              <BrandSelector setThreadId={setThreadId} />
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
