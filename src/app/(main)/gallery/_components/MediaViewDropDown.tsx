"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { OrderBy } from "@/types/gallery.types";

interface MediaViewsDropdownProps {
  galleryView: "grid" | "folder";
  setGalleryView: (view: "grid" | "folder") => void;
  selectedCampaignId?: string | null;
}

const MediaViewsDropdown: React.FC<MediaViewsDropdownProps> = ({
  galleryView,
  setGalleryView,
  selectedCampaignId,
}) => {
  const {
    thumbnailShape,
    thumbnailSize,
    isAutoPlay,
    orderBy,
    setThumbnailShape,
    setThumbnailSize,
    setIsAutoPlay,
    setOrderBy,
  } = useGalleryFilterStore();
  return (
    <DropdownMenu>
      {/* Trigger */}
      <DropdownMenuTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-md px-3 py-1.5">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Views</span>
        </Button>
      </DropdownMenuTrigger>

      {/* Dropdown Content */}
      <DropdownMenuContent
        align="end"
        className="w-72 p-0 bg-white border rounded-lg shadow-lg"
      >
        <div className="border-b px-4 py-2">
          <h2 className="font-semibold text-gray-700">Views</h2>
        </div>

        <Accordion
          type="multiple"
          defaultValue={["gallery", "thumbnails", "autoplay", "order"]}
        >
          {/* Gallery View */}
          <AccordionItem value="gallery" className="border-b">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Gallery View
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Select
                value={galleryView}
                onValueChange={(val) =>
                  setGalleryView(val as "grid" | "folder")
                }
              >
                <SelectTrigger className="w-[140px] text-indigo-600 border-indigo-600">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="folder">Folder View</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Thumbnails */}
          <AccordionItem value="thumbnails" className="border-b">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Thumbnails
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-2">
              <div className="flex gap-2">
                {["small", "medium", "large"].map((size) => (
                  <Button
                    key={size}
                    variant={thumbnailSize === size ? "default" : "outline"}
                    className={`capitalize ${
                      thumbnailSize === size
                        ? "bg-indigo-600 text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setThumbnailSize(size as any)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {["dynamic", "square"].map((shape) => (
                  <Button
                    key={shape}
                    variant={thumbnailShape === shape ? "default" : "outline"}
                    className={`capitalize ${
                      thumbnailShape === shape
                        ? "bg-indigo-600 text-white"
                        : "border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setThumbnailShape(shape as any)}
                  >
                    {shape}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Autoplay */}
          <AccordionItem value="autoplay" className="border-b">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Autoplay Videos
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 flex items-center justify-between">
              <Label htmlFor="autoplay" className="text-gray-700">
                Off / On
              </Label>
              <Switch
                id="autoplay"
                checked={isAutoPlay}
                onCheckedChange={setIsAutoPlay}
                className="data-[state=checked]:bg-indigo-600"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Order */}
          <AccordionItem value="order">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Order by:
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Select
                value={orderBy}
                onValueChange={(val) => setOrderBy(val as OrderBy)}
              >
                <SelectTrigger className="w-full text-gray-700">
                  <SelectValue placeholder="Dropdown" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="brand_sort_order"
                    disabled={!selectedCampaignId}
                  >
                    Manual order
                  </SelectItem>
                  <SelectItem value="created_at_descending">
                    Created (newest first)
                  </SelectItem>
                  <SelectItem value="created_at_ascending">
                    Created (oldest first)
                  </SelectItem>
                  <SelectItem value="name_ascending">Name (A–Z)</SelectItem>
                  <SelectItem value="name_descending">Name (Z–A)</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MediaViewsDropdown;
