"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  
  pointerWithin,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { closestCorners } from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { toast } from "sonner";
import type { GalleryActions } from "@/hooks/useGallery";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type DragItemType =
  | "MEDIA_ITEM"
  | "MEDIA_ITEMS_MULTI"
  | "CAMPAIGN";

export interface MediaDragData {
  type: "MEDIA_ITEM" | "MEDIA_ITEMS_MULTI";
  itemIds: string[];
  sourceTab?: string;
  sourceCampaignId?: string | null;
}

export interface CampaignDragData {
  type: "CAMPAIGN";
  campaignId: string;
  isArchived: boolean;
}

export type DragData = MediaDragData | CampaignDragData;

export interface DropTargetData {
  type: "CAMPAIGN" | "TAB" | "SECTION" | "MEDIA_GRID";
  id: string;
  accepts: DragItemType[];
}

interface GalleryDndContextValue {
  // Drag state
  activeId: UniqueIdentifier | null;
  activeDragData: DragData | null;
  overId: UniqueIdentifier | null;
  
  // Selected items for multi-select drag
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Drag overlay info
  dragOverlayContent: React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const GalleryDndContext = createContext<GalleryDndContextValue | null>(null);

export function useGalleryDnd() {
  const context = useContext(GalleryDndContext);
  if (!context) {
    throw new Error("useGalleryDnd must be used within GalleryDndProvider");
  }
  return context;
}

// ============================================================================
// Drag Overlay Components
// ============================================================================

interface MediaDragOverlayProps {
  itemCount: number;
  previewItems?: GalleryItemResponse[];
}

function MediaDragOverlay({ itemCount, previewItems = [] }: MediaDragOverlayProps) {
  // For multi-select, show stacked image preview with up to 3 images
  if (itemCount > 1) {
    const displayItems = previewItems.slice(0, 3);
    
    return (
      <div className="relative">
        {/* Stacked images */}
        <div className="relative" style={{ width: '128px', height: '128px' }}>
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              className="absolute rounded-lg overflow-hidden shadow-2xl border-2 border-purple-500 bg-white"
              style={{
                width: '120px',
                height: '120px',
                top: `${index * 8}px`,
                left: `${index * 8}px`,
                zIndex: displayItems.length - index,
              }}
            >
              <img
                src={item.preview_url || item.asset_url}
                alt={`Item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        
        {/* Count badge */}
        <div className="absolute -top-2 -right-2 z-50 bg-purple-600 text-white px-3 py-1 rounded-full shadow-lg font-semibold text-sm border-2 border-white">
          {itemCount}
        </div>
      </div>
    );
  }

  // For single item, show the original large image preview
  const previewItem = previewItems[0];
  return (
    <div className="relative">
      {previewItem && (
        <div className="w-32 h-32 rounded-lg overflow-hidden shadow-2xl border-2 border-purple-500 bg-white">
          <img
            src={previewItem.preview_url || previewItem.asset_url}
            alt="Dragging"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

interface CampaignDragOverlayProps {
  campaignTitle: string;
}

function CampaignDragOverlay({ campaignTitle }: CampaignDragOverlayProps) {
  return (
    <div className="bg-white border-2 border-purple-500 rounded-lg px-4 py-2 shadow-2xl">
      <span className="text-sm font-medium text-gray-900">{campaignTitle}</span>
    </div>
  );
}

// ============================================================================
// Provider Props
// ============================================================================

interface GalleryDndProviderProps {
  children: ReactNode;
  
  // Gallery actions for mutations
  galleryActions?: GalleryActions;
  
  // Selected items state
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Current active tab
  activeTab?: string;
  
  // Current order by - reorder only allowed when "brand_sort_order"
  orderBy?: string;
  
  // Callbacks for different drop operations
  onMoveMediaToCampaign?: (itemIds: string[], campaignId: string) => Promise<void>;
  onMoveMediaToTab?: (itemIds: string[], tabValue: string, sourceTab?: string) => Promise<void>;
  onReorderMedia?: (reorderData: { id: string; brand_sort_order: number }[]) => void;
  onReorderCampaigns?: (
    campaignId: string,
    targetId: string,
    position: "before" | "after",
    section: "active" | "archived"
  ) => Promise<void>;
  onArchiveCampaign?: (campaignId: string, shouldArchive: boolean) => Promise<void>;
  
  // Campaign data for overlay
  campaigns?: Array<{ id: string; title: string; is_archived?: boolean }>;
}

// ============================================================================
// Provider Component
// ============================================================================

export function GalleryDndProvider({
  children,
  galleryActions,
  selectedItems,
  setSelectedItems,
  activeTab,
  orderBy,
  onMoveMediaToCampaign,
  onMoveMediaToTab,
  onReorderMedia,
  onReorderCampaigns,
  onArchiveCampaign,
  campaigns = [],
}: GalleryDndProviderProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that prioritizes sidebar/tab targets
const collisionDetection: CollisionDetection = useCallback((args) => {
  const { active, droppableContainers } = args;

  // Identify if we're dragging a media item
  const isMediaDrag =
    active.data.current?.type === "MEDIA_ITEM" ||
    active.data.current?.type === "MEDIA_ITEMS_MULTI";

  // 1️⃣ Check for non-grid drops first (campaigns, tabs, sections)
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const priorityTargets = pointerCollisions.filter((c) => {
      const data = c.data?.droppableContainer?.data?.current;
      return (
        data?.type === "CAMPAIGN" ||
        data?.type === "TAB" ||
        data?.type === "SECTION"
      );
    });

    // If we found priority targets (sidebar elements), use them
    if (priorityTargets.length > 0) {
      return priorityTargets;
    }
  }

  // 2️⃣ Media grid sorting → use closestCenter for better grid support
  // closestCenter works better for grid layouts with horizontal movement
  if (isMediaDrag) {
    return closestCenter(args);
  }

  // 3️⃣ Safe fallback
  return rectIntersection(args);
}, []);


  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData | undefined;
    
    setActiveId(active.id);
    setActiveDragData(data || null);
    
    // If dragging a selected item, include all selected items
    if (data?.type === "MEDIA_ITEM" && selectedItems.includes(String(active.id))) {
      setActiveDragData({
        ...data,
        type: selectedItems.length > 1 ? "MEDIA_ITEMS_MULTI" : "MEDIA_ITEM",
        itemIds: selectedItems,
      });
    }
  }, [selectedItems]);

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset state
    setActiveId(null);
    setActiveDragData(null);
    setOverId(null);
    
    if (!over) {
      return;
    }
    
    // Read drag data directly from event to avoid stale closure issues
    let dragData = active.data.current as DragData | undefined;
    
    // If dragging a selected item, include all selected items
    if (dragData?.type === "MEDIA_ITEM" && selectedItems.includes(String(active.id))) {
      dragData = {
        ...dragData,
        type: selectedItems.length > 1 ? "MEDIA_ITEMS_MULTI" : "MEDIA_ITEM",
        itemIds: selectedItems,
      };
    }
    
    if (!dragData) {
      return;
    }
    
    const overData = over.data.current as DropTargetData | DragData | undefined;
    
    // ========================================================================
    // Media Item Drop Handling
    // ========================================================================
    if (dragData.type === "MEDIA_ITEM" || dragData.type === "MEDIA_ITEMS_MULTI") {
      const mediaData = dragData as MediaDragData;
      const itemIds = mediaData.itemIds;
      const overId = String(over.id);
      
      // Drop on Campaign - check both the data type AND ID prefix (for droppable fallback)
      // The sortable returns type: "CAMPAIGN" with campaignId, the droppable uses "campaign-{id}" prefix
      const isCampaignDrop = 
        (overData && "type" in overData && overData.type === "CAMPAIGN" && "campaignId" in overData) ||
        overId.startsWith("campaign-");
      
      if (isCampaignDrop) {
        // Extract campaignId from either the data object or the ID
        const campaignId = 
          (overData && "campaignId" in overData && overData.campaignId) 
            ? (overData as CampaignDragData).campaignId 
            : overId.replace("campaign-", "");
        
        if (onMoveMediaToCampaign) {
          try {
            await onMoveMediaToCampaign(itemIds, campaignId);
            setSelectedItems([]);
          } catch (error) {
            console.error("Failed to move media to campaign:", error);
            toast.error("Failed to move items");
          }
        }
        return;
      }
      
      // Drop on Tab (check by ID prefix since tabs use "tab-{value}" format)
      if (overId.startsWith("tab-")) {
        const tabValue = overId.replace("tab-", "");
        if (onMoveMediaToTab) {
          try {
            await onMoveMediaToTab(itemIds, tabValue, mediaData.sourceTab);
            setSelectedItems([]);
          } catch (error) {
            console.error("Failed to move media to tab:", error);
            toast.error("Failed to move items");
          }
        }
        return;
      }
      
      // Reorder within grid - ONLY when orderBy is "brand_sort_order" (manual order)
      if (active.id !== over.id && onReorderMedia && galleryActions && orderBy === "brand_sort_order") {
        const items = galleryActions.getGalleryItems();
        const activeIndex = items.findIndex((i) => i.id === active.id);
        const overIndex = items.findIndex((i) => i.id === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          // Handle multi-select reorder
          const draggedIds = new Set(itemIds);
          const draggedItems = items.filter((item) => draggedIds.has(item.id));
          const remainingItems = items.filter((item) => !draggedIds.has(item.id));
          
          // Find target position in remaining items
          const targetInRemaining = remainingItems.findIndex((i) => i.id === over.id);
          const insertIndex = targetInRemaining !== -1 ? targetInRemaining : overIndex;
          
          // Build reordered array
          const reordered = [
            ...remainingItems.slice(0, insertIndex),
            ...draggedItems,
            ...remainingItems.slice(insertIndex),
          ];
          
          // Create reorder data
          const reorderData = reordered.map((item, index) => ({
            id: item.id,
            brand_sort_order: index,
          }));
          
          onReorderMedia(reorderData);
          setSelectedItems([]);
        }
      }
      return;
    }
    
    // ========================================================================
    // Campaign Drop Handling
    // ========================================================================
    if (dragData.type === "CAMPAIGN") {
      const campaignData = dragData as CampaignDragData;
      
      // Drop on Section (archive/unarchive)
      if (overData && "type" in overData && overData.type === "SECTION") {
        const targetSection = (overData as DropTargetData).id as "active" | "archived";
        const shouldArchive = targetSection === "archived";
        
        if (campaignData.isArchived !== shouldArchive && onArchiveCampaign) {
          try {
            await onArchiveCampaign(campaignData.campaignId, shouldArchive);
          } catch (error) {
            console.error("Failed to archive/unarchive campaign:", error);
          }
        }
        return;
      }
      
      // Reorder campaigns
      if (active.id !== over.id && onReorderCampaigns) {
        const targetData = over.data.current as CampaignDragData | undefined;
        if (targetData?.type === "CAMPAIGN") {
          const section = targetData.isArchived ? "archived" : "active";
          // Determine drop position based on pointer
          try {
            await onReorderCampaigns(
              campaignData.campaignId,
              targetData.campaignId,
              "after", // Default to after, actual position calculated in handler
              section
            );
          } catch (error) {
            console.error("Failed to reorder campaigns:", error);
          }
        }
      }
    }
  }, [
    selectedItems,
    galleryActions,
    orderBy,
    onMoveMediaToCampaign,
    onMoveMediaToTab,
    onReorderMedia,
    onReorderCampaigns,
    onArchiveCampaign,
    setSelectedItems,
  ]);

  // Build drag overlay content
  const dragOverlayContent = useMemo(() => {
    if (!activeId || !activeDragData) return null;
    
    if (activeDragData.type === "MEDIA_ITEM" || activeDragData.type === "MEDIA_ITEMS_MULTI") {
      const mediaData = activeDragData as MediaDragData;
      const items = galleryActions?.getGalleryItems() || [];
      
      // Get preview items for all selected items
      const previewItems = items.filter((item) => mediaData.itemIds.includes(item.id));
      
      return (
        <MediaDragOverlay
          itemCount={mediaData.itemIds.length}
          previewItems={previewItems}
        />
      );
    }
    
    if (activeDragData.type === "CAMPAIGN") {
      const campaignData = activeDragData as CampaignDragData;
      const campaign = campaigns.find((c) => c.id === campaignData.campaignId);
      
      return (
        <CampaignDragOverlay
          campaignTitle={campaign?.title || "Campaign"}
        />
      );
    }
    
    return null;
  }, [activeId, activeDragData, galleryActions, campaigns]);

  // Context value
  const contextValue = useMemo<GalleryDndContextValue>(
    () => ({
      activeId,
      activeDragData,
      overId,
      selectedItems,
      setSelectedItems,
      dragOverlayContent,
    }),
    [activeId, activeDragData, overId, selectedItems, setSelectedItems, dragOverlayContent]
  );

  return (
    <GalleryDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
          {dragOverlayContent}
        </DragOverlay>
      </DndContext>
    </GalleryDndContext.Provider>
  );
}

// ============================================================================
// Helper Hooks for Droppable Targets
// ============================================================================

export function useCampaignDroppable(campaignId: string) {
  return {
    id: `campaign-${campaignId}`,
    data: {
      type: "CAMPAIGN" as const,
      id: campaignId,
      accepts: ["MEDIA_ITEM", "MEDIA_ITEMS_MULTI"] as DragItemType[],
    },
  };
}

export function useTabDroppable(tabValue: string) {
  return {
    id: `tab-${tabValue}`,
    data: {
      type: "TAB" as const,
      id: tabValue,
      accepts: ["MEDIA_ITEM", "MEDIA_ITEMS_MULTI"] as DragItemType[],
    },
  };
}

export function useSectionDroppable(section: "active" | "archived") {
  return {
    id: `section-${section}`,
    data: {
      type: "SECTION" as const,
      id: section,
      accepts: ["CAMPAIGN"] as DragItemType[],
    },
  };
}