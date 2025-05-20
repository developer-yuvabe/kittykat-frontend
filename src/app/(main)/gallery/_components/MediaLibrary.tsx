"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadDropzone } from "./UploadDropzone";
import { SearchFilters } from "./SearchFilters";
import { MasonryGrid } from "./MasonryGrid";
import { BulkActions } from "./BulkActions";
import { FilterSidebar } from "./FilterSidebar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { GalleryCollection } from "@/types/gallery.types";
import { generateSampleData } from "@/services/api/gallery.service";

export function MediaLibrary() {
  const [activeTab, setActiveTab] = useState("all-media");
  const [mediaItems, setMediaItems] = useState<GalleryCollection[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<boolean>(false);
  const [source, setSource] = useState<string>("All");
  const [creator, setCreator] = useState<string>("Anyone");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    brands: ["Tods", "Birkenstock"],
    categories: [],
    campaigns: ["Valentines Day", "Summer Jam"],
  });

  useEffect(() => {
    // Load sample data
    const data = generateSampleData();
    setMediaItems(data);
  }, []);

  const filteredItems = mediaItems.filter((item) => {
    // Filter by tab
    if (
      activeTab !== "all-media" &&
      !mapTabToAssetType(activeTab).includes(item.asset_type)
    ) {
      return false;
    }

    // Filter by favorites
    if (favorites && !item.is_favourite) {
      return false;
    }

    // Filter by source
    if (source !== "All" && item.asset_source !== source.toLowerCase()) {
      return false;
    }

    // Filter by creator
    if (creator === "Me" && item.created_by !== "current_user") {
      return false;
    } else if (creator === "Others" && item.created_by === "current_user") {
      return false;
    }

    // Filter by search query
    if (
      searchQuery &&
      !item.asset_title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedItems([]);
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };

  const handleToggleFavorite = (id: string) => {
    setMediaItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, is_favourite: !item.is_favourite };
        }
        return item;
      })
    );
  };

  const handleToggleReaction = (
    id: string,
    reaction: "like" | "dislike" | null
  ) => {
    setMediaItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            user_action: item.user_action === reaction ? null : reaction,
          };
        }
        return item;
      })
    );
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
  };

  const handleCreatorChange = (value: string) => {
    setCreator(value);
  };

  const handleFavoritesChange = (checked: boolean) => {
    setFavorites(checked);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = (filters: any) => {
    setSelectedFilters(filters);
    setShowFilters(false);
  };

  return (
    <div className="flex flex-col w-full  mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">Media library</h1>

      <Tabs
        defaultValue="all-media"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-4  max-w-2xl justify-start rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger
            value="all-media"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent "
          >
            All Media
          </TabsTrigger>
          <TabsTrigger
            value="moodboards"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
          >
            Moodboards
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
          >
            Images
          </TabsTrigger>
          <TabsTrigger
            value="videos"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
          >
            Videos
          </TabsTrigger>
          <TabsTrigger
            value="models"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
          >
            Models
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent "
          >
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className=" p-3 rounded-3xl bg-white">
          <UploadDropzone activeTab={activeTab} />

          <div className="flex flex-col md:flex-row gap-4">
            <div
              className={`${
                showFilters ? "w-full md:w-1/4" : "hidden"
              } transition-all duration-300 ease-in-out`}
            >
              <div className="md:hidden flex justify-between items-center mb-2">
                <h3 className="font-medium">Filters</h3>
                <Button variant="ghost" size="sm" onClick={toggleFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <FilterSidebar
                selectedFilters={selectedFilters}
                onApply={handleApplyFilters}
              />
            </div>

            <div
              className={`${
                showFilters ? "w-full md:w-3/4" : "w-full"
              } transition-all duration-300 ease-in-out`}
            >
              <SearchFilters
                onSearchChange={handleSearchChange}
                onSourceChange={handleSourceChange}
                onCreatorChange={handleCreatorChange}
                onFavoritesChange={handleFavoritesChange}
                onToggleFilters={toggleFilters}
                source={source}
                creator={creator}
                favorites={favorites}
                showFilters={showFilters}
                selectedFilters={selectedFilters}
              />

              <MasonryGrid
                items={filteredItems}
                selectedItems={selectedItems}
                onSelect={handleSelect}
                onToggleFavorite={handleToggleFavorite}
                onToggleReaction={handleToggleReaction}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {selectedItems.length > 0 && (
        <BulkActions
          selectedCount={selectedItems.length}
          onUnselectAll={handleUnselectAll}
        />
      )}
    </div>
  );
}

function mapTabToAssetType(tab: string): string[] {
  switch (tab) {
    case "moodboards":
      return ["image"];
    case "images":
      return ["image"];
    case "videos":
      return ["video"];
    case "models":
      return ["model"];
    case "products":
      return ["image", "model"];
    default:
      return ["image", "video", "model"];
  }
}
