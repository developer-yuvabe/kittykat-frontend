"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GalleryActions } from "@/hooks/useGallery";
import { useDroppable } from "@dnd-kit/core";
import { useGalleryDnd, type MediaDragData } from "../GalleryDndContext";

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
  onDrop,
}: {
  tab: Tab;
  isActive: boolean;
  onTabChange: (value: string) => void;
  onDrop: (tabValue: string) => void;
}) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `tab-${tab.value}`,
    data: {
      type: "TAB",
      id: tab.value,
      accepts: ["MEDIA_ITEM", "MEDIA_ITEMS_MULTI"],
    },
  });

  // Check if we should show drop indicator
  const showDropIndicator = isOver && active?.data.current?.type !== "CAMPAIGN";

  return (
    <button
      ref={setNodeRef}
      onClick={() => onTabChange(tab.value)}
      className={cn(
        "text-sm font-medium text-gray-600 hover:text-gray-900 py-3 px-4 transition-all border-b-2 border-transparent",
        isActive && "border-[#636AE8] text-[#636AE8] bg-[#F3F4F6]",
        showDropIndicator && "ring-2 ring-purple-500 bg-purple-50 border-purple-500"
      )}
    >
      {tab.label}
    </button>
  );
}

export function FolderTabs({
  activeTab,
  onTabChange,
  galleryActions,
  setSelectedItems,
}: FolderTabsProps) {
  // Try to get DnD context, but don't fail if not available
  let dndContext: ReturnType<typeof useGalleryDnd> | null = null;
  try {
    dndContext = useGalleryDnd();
  } catch {
    // Not wrapped in DnD context, that's okay for some views
  }

  // Handle drop on tab - this is called from the context
  const handleDrop = async (targetTab: string) => {
    if (!dndContext?.activeDragData) return;
    
    const dragData = dndContext.activeDragData as MediaDragData;
    if (dragData.type !== "MEDIA_ITEM" && dragData.type !== "MEDIA_ITEMS_MULTI") {
      return;
    }

    const { itemIds, sourceTab } = dragData;

    // Block dropping from "all-media" to anywhere
    if (sourceTab === "all-media") {
      toast.error("Items from 'All Media' cannot be moved.");
      return;
    }

    // Block dropping to "all-media"
    if (targetTab === "all-media") {
      toast.error("Items cannot be moved into 'All Media'.");
      return;
    }

    // If dropped on same tab → ignore
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

  return (
    <div className="w-full border-b bg-[#F9FAFB]">
      <div className="grid grid-cols-7 w-full">
        {tabs.map((tab) => (
          <DroppableTabButton
            key={tab.value}
            tab={tab}
            isActive={activeTab === tab.value}
            onTabChange={onTabChange}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
