"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GalleryActions } from "@/hooks/useGallery";

interface Tab {
  value: string;
  label: string;
}

interface FolderTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  title?: string;
  galleryActions: GalleryActions; // you’ll use this for patchItem
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
}

const tabs: Tab[] = [
  { value: "all-media", label: "All Media" },
  { value: "brand-uploads", label: "Brand Uploads" },
  { value: "moodboard", label: "Moodboards" },
  { value: "showboard-media", label: "Concept Visuals" },
  { value: "a2i-media", label: "A2i Media" },
  { value: "products", label: "Products" },
  { value: "pexels", label: "Pexels" },
];

export function FolderTabs({
  activeTab,
  onTabChange,
  galleryActions,
  setSelectedItems,
}: FolderTabsProps) {
  // ---- Handle drop ----
  const handleDrop = async (
    e: React.DragEvent<HTMLButtonElement>,
    targetTab: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData("application/gallery-drag");
    if (!data) return;

    const payload = JSON.parse(data);
    const { itemIds, activeTab: sourceTab } = payload;

    // 1. Block dropping from "all-media" to anywhere
    if (sourceTab === "all-media") {
      toast.error("Items from 'All Media' cannot be moved.");
      return;
    }

    // 2. Block dropping to "all-media"
    if (targetTab === "all-media") {
      toast.error("Items cannot be moved into 'All Media'.");
      return;
    }

    // 3. If dropped on same tab → ignore
    if (targetTab === sourceTab) {
      toast.info("Items are already in this tab.");
      return;
    }

    if (targetTab === "pexels") {
      toast.error("Items cannot be moved into 'Pexels' Tab.");
      return;
    }

    try {
      toast.loading("Moving items...", { id: "move-items" });

      await Promise.all(
        itemIds.map((itemId: string) =>
          galleryActions.patchItem?.({
            itemId,
            data: { asset_source: targetTab },
            revalidateAutofillSuggestions: false,
          })
        )
      );

      toast.success(`Moved ${itemIds.length} item(s) to ${targetTab}.`, {
        id: "move-items",
      });
      setSelectedItems([]); // Clear selection after move
    } catch (error) {
      console.error("Move failed:", error);
      toast.error("Failed to move items.", { id: "move-items" });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    // Allow drop
    if (e.dataTransfer.types.includes("application/gallery-drag")) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full border-b bg-[#F9FAFB]">
      <div className="grid grid-cols-7 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            onDrop={(e) => handleDrop(e, tab.value)}
            onDragOver={handleDragOver}
            className={cn(
              "text-sm font-medium text-gray-600 hover:text-gray-900 py-3 px-4 transition-all border-b-2 border-transparent",
              activeTab === tab.value &&
                "border-[#636AE8] text-[#636AE8] bg-[#F3F4F6]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
