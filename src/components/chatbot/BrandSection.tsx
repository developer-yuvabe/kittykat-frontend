// components/BrandOverview.tsx

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "../shared/ContentSection";
import { CirclePlus, Copy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Thread, ToolMessage } from "@langchain/langgraph-sdk";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

export const renderBrandData = (
  expandedSections: { [key: string]: boolean },
  toggleSection: (section: string) => void,
  setThreadId: (id: string | null) => void,
  staticData: any,
  dynamicData: any
) => {
  console.log("static data", staticData);
  try {
    const brandName = staticData.brand?.name || "No Brand Name";
    const brandInitial = brandName.charAt(0).toUpperCase();
    const allColors = [
      { ...staticData?.colors?.primary, label: "Primary" },
      { ...staticData?.colors?.secondary, label: "Secondary" },
      ...staticData?.colors?.others.map((color: Color) => ({
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
                    <div className="flex justify-between gap-x-2">
                      <div>
                        <BrandSelector setThreadId={setThreadId} />
                      </div>
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
      context={{ tagline, values }}
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
  // Helper to check if a font is valid
  const isValidFont = (font?: FontDetails) => {
    return font?.name?.trim() && (font.weights?.some((w) => w.trim()) ?? true);
  };

  // Filter out invalid fonts
  const validPrimaryFont = isValidFont(primaryFont) ? primaryFont : undefined;
  const validSecondaryFont = isValidFont(secondaryFont)
    ? secondaryFont
    : undefined;

  // Skip rendering if no valid fonts are present
  if (!validPrimaryFont && !validSecondaryFont) return null;

  const renderFontDetails = (label: string, font: FontDetails) => (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label}</div>
      <div className="ml-2 space-y-1">
        <div className="text-sm text-gray-700">{font.name}</div>
        {font?.weights && font?.weights.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {font.weights
              .filter((weight) => weight.trim())
              .map((weight, index) => (
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

  return (
    <ContentSection
      title="Brand Typography"
      content={
        <div className="space-y-4">
          {validPrimaryFont &&
            renderFontDetails("Primary Font", validPrimaryFont)}
          {validSecondaryFont &&
            renderFontDetails("Secondary Font", validSecondaryFont)}
        </div>
      }
      context={{ primaryFont, secondaryFont }}
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

  // Filter valid colors
  const validColors = colors.filter((color) =>
    /^#[0-9A-Fa-f]{6}$/.test(color.hex)
  );

  // Skip rendering if no valid colors
  if (validColors.length === 0) return null;

  const copyToClipboard = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setCopiedColor(colorHex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <ContentSection
      title="Brand Colors"
      content={
        <div className="flex flex-wrap gap-4">
          {validColors.map((color, idx) => (
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
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 transition-opacity rounded ${
                    isNearWhite(color.hex)
                      ? "text-black"
                      : "text-primary-foreground"
                  }`}
                >
                  <div className="font-light text-[12px]">{color.name}</div>
                  <div className="text-base text-[10px]">{color.hex}</div>
                  {color.label && (
                    <div className="text-[8px] mt-1">{color.label}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
      context={{ colors }}
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
      context={{ products }}
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
      context={{ logos }}
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
          context={{ [key]: value }}
        />
      ))}
    </>
  );
};

import { useEffect } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { useThreads } from "@/providers/Thread";
import { getContentString } from "../thread/utils";
import { isNearWhite } from "@/lib/utils";

interface BrandSelectorProps {
  setThreadId: (id: string | null) => void;
}

interface TransformedThread {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string; // Unique search key combining name and ID
  raw: Thread;
}

export default function BrandSelector({ setThreadId }: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedThreads, setTransformedThreads] = useState<
    TransformedThread[]
  >([]);
  const [filteredThreads, setFilteredThreads] = useState<TransformedThread[]>(
    []
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  // Fetch and transform threads on initial open
  useEffect(() => {
    if (open && threads.length === 0 && !threadsLoading) {
      const fetchThreads = async () => {
        try {
          setThreadsLoading(true);
          const fetchedThreads = await getThreads();
          setThreads(fetchedThreads);

          // Transform threads once on fetch
          const transformed = fetchedThreads.map((thread) => {
            const displayName = getThreadDisplayName(thread);
            return {
              id: thread.thread_id,
              displayName,
              initial: displayName.charAt(0).toUpperCase(),
              searchKey: `${displayName}::${thread.thread_id}`, // Create unique key for each item
              raw: thread,
            };
          });

          setTransformedThreads(transformed);
          setFilteredThreads(transformed);
        } catch (error) {
          console.error("Failed to fetch threads:", error);
        } finally {
          setThreadsLoading(false);
        }
      };
      fetchThreads();
    } else if (open && threads.length > 0 && transformedThreads.length === 0) {
      const transformed = threads.map((thread) => {
        const displayName = getThreadDisplayName(thread);
        return {
          id: thread.thread_id,
          displayName,
          initial: displayName.charAt(0).toUpperCase(),
          searchKey: `${displayName}::${thread.thread_id}`, // Create unique key for each item
          raw: thread,
        };
      });

      setTransformedThreads(transformed);
      setFilteredThreads(transformed);
    }
  }, [
    open,
    threads,
    transformedThreads.length,
    threadsLoading,
    getThreads,
    setThreads,
    setThreadsLoading,
  ]);

  // Update filtered threads when search query changes
  useEffect(() => {
    if (transformedThreads.length === 0) return;

    if (searchQuery.trim() === "") {
      setFilteredThreads(transformedThreads);
    } else {
      const filtered = transformedThreads.filter((thread) =>
        thread.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredThreads(filtered);
    }
  }, [searchQuery, transformedThreads]);

  const getThreadDisplayName = (thread: Thread) => {
    if (
      typeof thread.metadata === "object" &&
      thread.metadata &&
      "name" in thread.metadata &&
      thread.metadata.name
    ) {
      return String(thread.metadata.name);
    } else if (
      typeof thread.values === "object" &&
      thread.values &&
      "messages" in thread.values &&
      Array.isArray(thread.values.messages) &&
      thread.values.messages.length > 0
    ) {
      const firstMessage = thread.values.messages[0];
      return getContentString(firstMessage.content).slice(0, 50);
    }
    return thread.thread_id;
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadId(threadId);
    setOpen(false);
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={10} className="text-black" />
            Load existing Brand
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Search brands..."
                className="h-9 border-0 outline-none  focus-visible:ring-0"
                value={searchQuery}
                onValueChange={handleInputChange}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {threadsLoading ? "Loading..." : "No brands found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredThreads.map((thread) => (
                  <CommandItem
                    key={thread.id}
                    value={thread.searchKey} // Use unique searchKey
                    onSelect={() => handleThreadSelect(thread.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {thread.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate ">{thread.displayName}</span>
                    </div>
                    {selectedThreadId === thread.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
