import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  extractAllColors,
  filterAndNormalizeColors,
  getFontColorForBackground,
  getThreadDisplayName,
} from "@/lib/langgraph.utils";
import {
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Copy,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { ContentSection } from "../shared/ContentSection";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

export const renderBrandData = (
  expandedSections: { [key: string]: boolean },
  toggleSection: (section: string) => void,
  setThreadId: (id: string | null) => void,
  staticData: any,
  dynamicData: any,
  clearPinnedItem: () => void
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
                  {staticData?.logos?.length > 0 &&
                  isValidUrl(staticData?.logos[0]) ? (
                    // Render the first valid logo
                    <img
                      src={staticData?.logos[0]}
                      alt="Brand Logo"
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    // Render the brand initial circle
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-3 overflow-hidden">
                      <span className="text-white font-bold">
                        {brandInitial}
                      </span>
                    </div>
                  )}
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
                            clearPinnedItem();
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
                          clearPinnedItem();
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
              />

              {/* Typography Section */}
              <TypographySection
                primaryFont={staticData?.typography?.primaryFont}
                secondaryFont={staticData?.typography?.secondaryFont}
              />

              {/* Colors Section */}
              <BrandColors colors={allColors} />

              {/* Products Section */}
              <ProductsSection products={staticData?.products} />

              {/* Logos Section */}
              <LogosSection logos={staticData?.logos} />

              {/* Dynamic Data Section */}
              {/* <DynamicContentSection dynamicData={dynamicData} /> */}

              <BrandMedia
                contactInfo={brandMediaMockData.contactInfo}
                media={brandMediaMockData.media}
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
  weights?: any[];
}

interface TypographyProps {
  primaryFont?: FontDetails;
  secondaryFont?: FontDetails;
}

export const TypographySection: React.FC<TypographyProps> = ({
  primaryFont,
  secondaryFont,
}) => {
  // Helper to check if a font is valid (name is required, weights are optional)
  const isValidFont = (font?: FontDetails) => {
    return font?.name?.trim();
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
        {font.weights && font.weights.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {font.weights
              .filter(
                (weight) =>
                  weight !== undefined &&
                  weight !== null &&
                  String(weight).trim()
              )
              .map((weight, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                >
                  {String(weight)}
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

interface BrandColorsProps {
  colors: Color[];
}

export const BrandColors: React.FC<BrandColorsProps> = ({ colors }) => {
  const validColors = filterAndNormalizeColors(colors);

  // Skip rendering if no valid colors
  if (validColors.length === 0) return null;

  const copyToClipboard = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    toast.success(`Color ${colorHex} copied to clipboard!`, {
      position: "top-right",
    });
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
                <TooltipIconButton
                  tooltip="Copy color"
                  side="top"
                  onClick={() => copyToClipboard(color.hex)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  <Copy size={16} />
                </TooltipIconButton>

                {/* Color Info on Hover */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 transition-opacity rounded`}
                  style={{ color: getFontColorForBackground(color.hex) }}
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
  logos?: string[];
}

export const LogosSection: React.FC<LogosSectionProps> = ({ logos = [] }) => {
  const validLogos = logos.filter(isValidUrl);

  if (validLogos.length === 0) return null;

  return (
    <ContentSection
      title="Logos"
      content={
        <div className="flex flex-wrap gap-4 mt-2">
          {validLogos.map((logo, index) => (
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
      context={{ logos: validLogos }}
    />
  );
};

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { isValidUrl } from "@/lib/utils";
import { useThreads } from "@/providers/langgraph/Thread";
import { Color, TransformedThread } from "@/types/langgraph.types";
import { Check, Search } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import ReusableAlertDialog from "../shared/ReusableAlertDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { socialLinks } from "@/lib/icons";
interface BrandSelectorProps {
  setThreadId: (id: string | null) => void;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    deleteThread,
  } = useThreads();

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

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setThreadId(threadId);
    setOpen(false);
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  // Delete thread functionality
  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;

    setIsDeleting(true);
    try {
      toast.promise(deleteThread(threadToDelete), {
        loading: "Deleting Brand...",
        success: "Brand deleted successfully!",
        error: "Failed to delete the Brand.",
        position: "top-right",
      });

      // Update the local state
      const updatedTransformed = transformedThreads.filter(
        (thread) => thread.id !== threadToDelete
      );
      setTransformedThreads(updatedTransformed);
      setFilteredThreads(updatedTransformed);

      // If the deleted thread was selected, clear the selection
      if (selectedThreadId === threadToDelete) {
        setSelectedThreadId(null);
        setThreadId(null);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  };
  // Delete all threads functionality
  const handleDeleteAllConfirm = async () => {
    setIsDeleting(true);
    try {
      const promises = filteredThreads.map((thread) => deleteThread(thread.id));
      toast.promise(Promise.allSettled(promises), {
        loading: "Deleting all brands...",
        success: "All brands deleted successfully!",
        error: "An error occurred while deleting all threads.",
        position: "top-right",
      });

      // Clear the local state
      setTransformedThreads([]);
      setFilteredThreads([]);
      setSelectedThreadId(null);
      setThreadId(null);
    } catch (error) {
      console.error("Error deleting all threads:", error);
    } finally {
      setIsDeleting(false);
      setDeleteAllDialogOpen(false);
    }
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
                className="h-9 border-0 outline-none focus-visible:ring-0"
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
                    onSelect={() => {
                      handleThreadSelect(thread.id);
                    }}
                    className="flex items-center justify-between group"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {thread.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{thread.displayName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {selectedThreadId === thread.id && (
                        <Check className="h-4 w-4" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreadToDelete(thread.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {filteredThreads.length > 0 && (
                <div className="p-2 border-t sticky bottom-0 bg-white">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteAllDialogOpen(true)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete All Brands
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Delete Single Brand Dialog */}
      <ReusableAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        danger={true}
      />

      {/* Delete All Brands Dialog */}
      <ReusableAlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        title="Delete All Brands"
        description={`Are you sure you want to delete all brands? This will remove ${
          filteredThreads.length
        } brand${
          filteredThreads.length !== 1 ? "s" : ""
        } and cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAllConfirm}
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  );
}

interface BrandMediaProps {
  media: string[];
  contactInfo: {
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export const brandMediaMockData = {
  media: [
    "https://storage.googleapis.com/kittykat-dev/generated_images/01b2062e-9ccd-4478-9720-1470013ae8ef.png",
    "https://storage.googleapis.com/kittykat-dev/generated_images/01b2062e-9ccd-4478-9720-1470013ae8ef.png",
    "https://storage.googleapis.com/platform-img-generation-assets/fashn_outputs/9a6b12cf_0.webp",
    "https://storage.googleapis.com/kittykat-dev/generated_images/01b2062e-9ccd-4478-9720-1470013ae8ef.png",
    "https://storage.googleapis.com/kittykat-dev/generated_images/01b2062e-9ccd-4478-9720-1470013ae8ef.png",
  ],
  contactInfo: {
    website: "https://www.nike.com",
    facebook: "https://www.facebook.com/nikefootball",
    instagram: "https://www.instagram.com/nikefootball",
    tiktok: "https://www.tiktok.com/nikefootball",
  },
};

interface BrandMediaProps {
  media: string[];
  contactInfo: {
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

const BrandMedia: React.FC<BrandMediaProps> = ({ media, contactInfo }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [api, setApi] = useState<any>(null);
  const centerIndex = Math.floor(media.length / 2);
  const [current, setCurrent] = useState(centerIndex);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setCurrent(selectedIndex);
    };

    api.scrollTo(centerIndex);

    api.on("select", onSelect);
    api.on("reInit", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, centerIndex]);

  return (
    <ContentSection
      title="Brand Media"
      content={
        <div className="relative">
          {/* Media Carousel */}
          <Carousel
            setApi={setApi}
            className="w-full mx-auto max-w-xl 2xl:max-w-3xl px-4 md:px-8"
            opts={{ align: "center", containScroll: false, dragFree: true }}
          >
            <CarouselContent className="-ml-4 md:-ml-8">
              {media.filter(isValidUrl).map((url, index) => (
                <CarouselItem
                  key={index}
                  className="basis-1/4 min-w-0 transition-all duration-300 px-2"
                >
                  <div
                    className="relative overflow-hidden rounded-md h-[120px]"
                    onClick={() => setExpandedImage(url)}
                  >
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Media ${index + 1}`}
                      className="h-full w-full object-cover cursor-pointer rounded-md"
                      style={{
                        transform: `scale(${
                          index === current
                            ? 1
                            : index === current - 1 || index === current + 1
                            ? 0.9
                            : index === current - 2 || index === current + 2
                            ? 0.8
                            : 0.7
                        })`,
                        opacity:
                          index === current
                            ? 1
                            : index === current - 1 || index === current + 1
                            ? 0.9
                            : 0.7,
                        transition: "all 0.4s ease-in-out",
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-[55px] h-10 bg-[#636AE8] hover:bg-purple-500 hover:text-white rounded-full text-white shadow-md border-none" />
            <CarouselNext className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-[55px] h-10 bg-[#636AE8] hover:bg-purple-500 hover:text-white rounded-full text-white shadow-md border-none" />
          </Carousel>

          {/* Contact Links */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            {socialLinks.map(({ platform, color, icon }) => {
              const url = contactInfo[platform as keyof typeof contactInfo];
              if (!isValidUrl(url)) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  className={`flex px-3 py-2 rounded-full items-center gap-1`}
                  style={{ backgroundColor: color }}
                  target="_blank"
                  rel="noreferrer"
                >
                  {icon}
                  <span>
                    {platform === "instagram"
                      ? "@" +
                        new URL(url).pathname.split("/").filter(Boolean).pop()
                      : platform === "website"
                      ? new URL(url).hostname.replace(/^www\./, "")
                      : new URL(url).pathname.split("/").filter(Boolean).pop()}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Expanded Image Modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <img
                src={expandedImage}
                alt="Expanded media"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </div>
          )}
        </div>
      }
      context={{ media, contactInfo }}
    />
  );
};
