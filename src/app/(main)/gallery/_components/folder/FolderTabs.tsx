"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GalleryActions } from "@/hooks/useGallery";
import { useDroppable } from "@dnd-kit/core";
import { useTabDroppable } from "@/lib/gallery-dnd.utils";

interface Tab {
  value: string;
  label: string;
}

interface FolderTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  title?: string;
  galleryActions: GalleryActions; // you'll use this for patchItem
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

// Individual droppable tab button
function DroppableTabButton({
  tab,
  isActive,
  onTabChange,
}: {
  tab: Tab;
  isActive: boolean;
  onTabChange: (value: string) => void;
}) {
  const droppableConfig = useTabDroppable(tab.value);
  const { setNodeRef, isOver, active } = useDroppable(droppableConfig);

  // Check if we should show drop indicator
  const showDropIndicator = isOver && active?.data.current?.type !== "CAMPAIGN";

  return (
    <button
      ref={setNodeRef}
      onClick={() => onTabChange(tab.value)}
      className={cn(
        "text-sm font-medium text-gray-600 hover:text-gray-900 py-3 px-4 transition-all border-b-2 border-transparent",
        isActive && "border-[#636AE8] text-[#636AE8] bg-[#F3F4F6]",
        showDropIndicator &&
          "ring-2 ring-purple-500 bg-purple-50 border-purple-500"
      )}
    >
      {tab.label}
    </button>
  );
}

export function FolderTabs({ activeTab, onTabChange }: FolderTabsProps) {
  return (
    <div className="w-full border-b bg-[#F9FAFB]">
      <div className="grid grid-cols-7 w-full">
        {tabs.map((tab) => (
          <DroppableTabButton
            key={tab.value}
            tab={tab}
            isActive={activeTab === tab.value}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </div>
  );
}
