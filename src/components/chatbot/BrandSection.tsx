// components/BrandOverview.tsx

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "../shared/ContentSection";
import { CirclePlus, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ToolMessage } from "@langchain/langgraph-sdk";

import ErrorCard from "../shared/ErrorCard";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

export const renderBrandData = (
  message: ToolMessage,
  expandedSections: { [key: string]: boolean },
  toggleSection: (section: string) => void,
  setThreadId: (id: string | null) => void
) => {
  try {
    // Parse JSON if the content is a string
    const parsedContent =
      typeof message.content === "string"
        ? JSON.parse(message.content)
        : message.content;

    // Access the brand data (without focusing on static/dynamic as top-level keys)
    const { static: staticData, dynamic: dynamicData } = parsedContent;

    if (!staticData) {
      throw new Error("Static brand data not found");
    }

    const brandName = staticData.brand?.name || "No Brand Name";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const allColors = [
      { ...staticData.colors.primary, label: "Primary" },
      { ...staticData.colors.secondary, label: "Secondary" },
      ...staticData.colors.others.map((color: Color) => ({
        ...color,
        label: color.name,
      })),
    ];

    const validLogos = (staticData.logos || []).filter((logo: string) => {
      try {
        const url = new URL(logo);
        return /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(url.pathname);
      } catch {
        return false;
      }
    });

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
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
                    <span className="text-white font-bold">{brandInitial}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      {staticData?.brand?.name
                        ? `Brand: ${staticData?.brand?.name}`
                        : "Brand Information"}
                    </div>
                    <div className="text-xs text-[#6e7787]">
                      Set up, switch, and modify your Brand
                    </div>
                  </div>
                </div>
              ) : (
                <div className="">
                  <div className="font-bold ">
                    Brand: {staticData?.brand?.name}
                  </div>
                  <div className="absolute right-3 top-6 ">
                    <TooltipIconButton
                      size="lg"
                      className="p-4"
                      tooltip="New Brand"
                      variant="ghost"
                      onClick={() => setThreadId(null)}
                    >
                      <CirclePlus className="size-5" />
                    </TooltipIconButton>
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
                tagline={staticData.brand.tagline}
                values={staticData.brand.values}
              />

              {/* Typography Section */}
              <TypographySection
                primaryFont={staticData.typography.primaryFont}
                secondaryFont={staticData.typography.secondaryFont}
              />

              {/* Colors Section */}
              <BrandColors colors={allColors} />

              {/* Products Section */}
              <ProductsSection products={staticData.products} />

              {/* Logos Section */}
              <LogosSection logos={validLogos} />

              {/* Dynamic Data Section */}
              <DynamicContentSection dynamicData={dynamicData} />
            </div>
          </CardContent>
        )}
      </Card>
    );
  } catch (error) {
    console.error("Error parsing brand data:", error);
    return (
      <ErrorCard
        title="Error parsing brand data"
        message="There was an error displaying the brand information."
      />
    );
  }
};

interface BrandOverviewProps {
  tagline?: string;
  values?: string[];
}

export const BrandOverview: React.FC<BrandOverviewProps> = ({
  tagline,
  values,
}) => {
  return (
    <ContentSection
      title="Brand Overview"
      content={
        <div className="space-y-3">
          {/* Tagline */}
          {tagline && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">{tagline}</span>
            </div>
          )}

          {/* Values */}
          {values && values.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-1 mt-1">
                {values.map((value, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-100"
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

interface FontDetails {
  name: string;
  weights?: string[];
}

interface TypographyProps {
  primaryFont?: FontDetails;
  secondaryFont?: FontDetails;
}

export const TypographySection: React.FC<TypographyProps> = ({
  primaryFont,
  secondaryFont,
}) => {
  const renderFontDetails = (label: string, font?: FontDetails) => {
    if (!font) return null;

    return (
      <div className="space-y-2">
        <div className="text-sm font-semibold">{label}</div>
        <div className="ml-2 space-y-1">
          <div className="text-sm text-gray-700">{font.name}</div>
          {font.weights && font.weights.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {font.weights.map((weight, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                >
                  {weight}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Don't render if no font data is available
  if (!primaryFont && !secondaryFont) return null;

  return (
    <ContentSection
      title="Brand Typography"
      content={
        <div className="space-y-4">
          {renderFontDetails("Primary Font", primaryFont)}
          {renderFontDetails("Secondary Font", secondaryFont)}
        </div>
      }
    />
  );
};

interface Color {
  name: string;
  hex: string;
  label?: string;
}

interface BrandColorsProps {
  colors: Color[];
}

export const BrandColors: React.FC<BrandColorsProps> = ({ colors }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setCopiedColor(colorHex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  if (!colors || colors.length === 0) return null;

  return (
    <ContentSection
      title="Brand Colors"
      content={
        <div className="flex flex-wrap gap-4">
          {colors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div
                className="h-24 w-24 rounded shadow-md transition-transform duration-200 group-hover:scale-95"
                style={{ backgroundColor: color.hex }}
              >
                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(color.hex)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  <Copy size={16} />
                </button>

                {/* Color Info on Hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 text-white transition-opacity rounded">
                  <div className="font-medium">{color.name}</div>
                  <div className="text-sm">{color.hex}</div>
                  {color.label && (
                    <div className="text-xs mt-1">{color.label}</div>
                  )}
                </div>
              </div>

              {/* Copied Indicator */}
              {copiedColor === color.hex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  Copied!
                </div>
              )}
            </div>
          ))}
        </div>
      }
    />
  );
};

interface ProductsSectionProps {
  products: string[];
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <ContentSection
      title="Products"
      content={
        <div className="flex flex-wrap gap-1 mt-1">
          {products.map((product, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-100"
            >
              {product}
            </Badge>
          ))}
        </div>
      }
    />
  );
};

interface LogosSectionProps {
  logos: string[];
}

export const LogosSection: React.FC<LogosSectionProps> = ({ logos }) => {
  if (logos.length === 0) return null;

  return (
    <ContentSection
      title="Logos"
      content={
        <div className="flex flex-wrap gap-4 mt-2">
          {logos.map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`Logo ${index + 1}`}
              className="h-20 w-auto rounded-lg shadow-md"
              loading="lazy"
            />
          ))}
        </div>
      }
    />
  );
};

interface DynamicContentSectionProps {
  dynamicData: Record<string, any>;
}
const RenderValue: React.FC<{ value: any; depth?: number }> = ({
  value,
  depth = 0,
}) => {
  // Handle different data types
  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">None</span>;
  }

  if (typeof value === "string") {
    return <span className="text-gray-700 text-sm">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500 italic">Empty list</span>;
    }

    // Check if array contains primitive values or objects
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((item, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs bg-gray-50 text-gray-700 border-gray-200"
            >
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    } else {
      // Array of objects
      return (
        <div className="space-y-3 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="pl-4  border-gray-200">
              <div className="mt-1">
                <RenderValue value={item} depth={depth + 1} />
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-2 mt-1">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className={`${depth > 0 ? "pl-4" : ""}`}>
            <div className="flex items-baseline">
              <span className="text-sm font-medium text-gray-600">
                {capitalizeKey(key)}:
              </span>
              <div className="ml-2 flex-1">
                <RenderValue value={val} depth={depth + 1} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for any other types
  return <span className="text-gray-700">{String(value)}</span>;
};

export const DynamicContentSection: React.FC<DynamicContentSectionProps> = ({
  dynamicData,
}) => {
  if (!dynamicData || Object.keys(dynamicData).length === 0) return null;

  return (
    <>
      {Object.entries(dynamicData).map(([key, value]) => (
        <ContentSection
          key={key}
          title={capitalizeKey(key)}
          content={
            <div className="ml-2 space-y-2">
              <RenderValue value={value} />
            </div>
          }
        />
      ))}
    </>
  );
};
