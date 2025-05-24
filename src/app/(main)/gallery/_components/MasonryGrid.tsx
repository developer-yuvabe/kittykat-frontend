"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Heart, Download, Trash2, Ellipsis } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { GalleryItemResponse } from "@/types/gallery.types";

interface MasonryGridProps {
  items: GalleryItemResponse[];
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (item: GalleryItemResponse) => void;
}

export function MasonryGrid({
  items,
  selectedItems,
  onSelect,
  onToggleFavorite,
  onDelete,
  onDownload,
}: MasonryGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});

  const breakpointColumnsObj = {
    default: 5,
    1536: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
  };

  const handleImageLoad = (id: string, event: any) => {
    const target = event.target as HTMLImageElement;

    // Store natural dimensions for aspect ratio
    setImageDimensions((prev) => ({
      ...prev,
      [id]: {
        width: target.naturalWidth,
        height: target.naturalHeight,
      },
    }));

    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const handleFavoriteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this item?")) {
      onDelete(id);
    }
  };

  const handleDownloadClick = (
    item: GalleryItemResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onDownload(item);
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {items.map((item) => {
        const isLoaded = loadedImages.has(item.id);
        const dimensions = imageDimensions[item.id] || { width: 1, height: 1 };
        const aspectRatio = dimensions.width / dimensions.height;

        return (
          <div
            key={item.id}
            className={`mb-4 relative group  overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div
              className="relative w-full"
              style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
                <Image
                  src={item.asset_url || "/placeholder.svg"}
                  alt={item.asset_title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  onLoad={(e) => handleImageLoad(item.id, e)}
                />
              </div>

              {/* Selection checkbox - only visible on hover or when selected */}
              <div
                className={`absolute top-2 left-2 z-10 transition-opacity duration-200 ${
                  hoveredItem === item.id || selectedItems.includes(item.id)
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) =>
                    onSelect(item.id, checked as boolean)
                  }
                  className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200"
                />
              </div>

              {/* Favorite button - always visible but more prominent on hover */}
              <div
                className={`absolute bottom-2 left-2 z-10 transition-opacity duration-200 ${
                  hoveredItem === item.id ? "opacity-100" : "opacity-0"
                }`}
                onClick={(e) => handleFavoriteClick(item.id, e)}
              >
                <Heart
                  color={!item.is_favourite ? "#000000" : ""}
                  className={`h-4 w-4 transition-all duration-300 ${
                    item.is_favourite
                      ? "fill-red-500 text-red-500"
                      : "text-white"
                  }`}
                />
              </div>

              {/* Action buttons - only visible on hover */}
              {hoveredItem === item.id && (
                <div className="absolute bottom-2 right-2 z-10 flex space-x-1">
                  <button
                    className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors duration-200 text-white"
                    onClick={(e) => handleDownloadClick(item, e)}
                    aria-label="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 rounded-full bg-black/30 hover:bg-red-500/70 transition-colors duration-200 text-white"
                    onClick={(e) => handleDeleteClick(item.id, e)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Title tooltip on hover */}
              {hoveredItem === item.id && (
                <div className="absolute top-2 right-2 z-10 max-w-[70%]">
                  <Ellipsis color="#323842FF" size={28} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Masonry>
  );
}
