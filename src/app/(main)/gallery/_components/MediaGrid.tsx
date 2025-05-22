"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GalleryItemResponse } from "@/types/gallery.types";

interface MediaGridProps {
  items: GalleryItemResponse[];
  selectedItems: string[];
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
}

export function MediaGrid({
  items,
  selectedItems,
  onSelect,
  onToggleFavorite,
}: MediaGridProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative group rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) =>
                onSelect(item.id, checked as boolean)
              }
              className="h-5 w-5 border-2 border-white bg-black/30 data-[state=checked]:bg-purple-600"
            />
          </div>

          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className="text-xs bg-black/50 text-white hover:bg-black/60"
            >
              {item.asset_type}
            </Badge>
          </div>

          {item.is_favourite && (
            <div className="absolute bottom-2 left-2 z-10">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </div>
          )}

          <div className="relative aspect-square">
            <Image
              src={item.asset_url || "/placeholder.svg"}
              alt={item.asset_title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />

            {/* Hover overlay */}
            {hoveredItem === item.id && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-3">
                <div className="flex justify-between items-end">
                  <p className="text-white text-sm font-medium truncate">
                    {item.asset_title}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-white hover:bg-white/20 rounded-full p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onToggleFavorite(item.id)}
                      >
                        {item.is_favourite
                          ? "Remove from favorites"
                          : "Add to favorites"}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Download</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
