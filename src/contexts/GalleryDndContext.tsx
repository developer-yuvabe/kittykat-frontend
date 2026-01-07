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
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { toast } from "sonner";
import type { GalleryActions } from "@/hooks/useGallery";

import {
  DragItemEnum,
  type DragData,
  type MediaDragData,
  type CampaignDragData,
  type DropTargetData,
} from "../types/gallery-dnd.types";
import { computeReorderData } from "../lib/gallery-reorder.utils";
import {
  resolveActiveDragData,
  resolveCampaignId,
  resolveTabValue,
  resolveSectionTarget,
  resolveCampaignSection,
  galleryCollisionDetection,
  canReorderMedia,
} from "../lib/gallery-dnd.utils";
import { MediaDragOverlay } from "@/app/(main)/gallery/_components/MediaDragOverlay";
import { CampaignDragOverlay } from "@/app/(main)/gallery/_components/CampaignDragOverlay";

interface GalleryDndContextValue {
  activeId: UniqueIdentifier | null;
  activeDragData: DragData | null;
  overId: UniqueIdentifier | null;
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  dragOverlayContent: React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const GalleryDndContext = createContext<GalleryDndContextValue | null>(null);

export function useGalleryDnd() {
  const context = useContext(GalleryDndContext);
  if (!context) {
    // Return safe defaults when not within provider
    return {
      activeId: null,
      activeDragData: null,
      overId: null,
      selectedItems: [],
      setSelectedItems: () => {},
      dragOverlayContent: null,
    };
  }
  return context;
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

  // Current order by - reorder only allowed when "brand_sort_order"
  orderBy?: string;

  // Callbacks for different drop operations
  onMoveMediaToCampaign?: (
    itemIds: string[],
    campaignId: string
  ) => Promise<void>;
  onMoveMediaToTab?: (
    itemIds: string[],
    tabValue: string,
    sourceTab?: string
  ) => Promise<void>;
  onReorderMedia?: (
    reorderData: { id: string; brand_sort_order: number }[]
  ) => void;
  onReorderCampaigns?: (
    campaignId: string,
    targetId: string,
    position: "before" | "after",
    section: "active" | "archived"
  ) => Promise<void>;
  onArchiveCampaign?: (
    campaignId: string,
    shouldArchive: boolean
  ) => Promise<void>;

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

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current as DragData | undefined;

      setActiveId(active.id);

      const resolvedData = resolveActiveDragData(
        active.id,
        data,
        selectedItems
      );
      setActiveDragData(resolvedData);
    },
    [selectedItems]
  );

  // Handle drag over (for visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // Reset state
      setActiveId(null);
      setActiveDragData(null);
      setOverId(null);

      if (!over) {
        return;
      }

      // Read drag data directly from event to avoid stale closure issues
      const rawDragData = active.data.current as DragData | undefined;
      const dragData = resolveActiveDragData(
        active.id,
        rawDragData,
        selectedItems
      );

      if (!dragData) {
        return;
      }

      const overData = over.data.current as
        | DropTargetData
        | DragData
        | undefined;

      // ========================================================================
      // Media Item Drop Handling
      // ========================================================================
      if (
        dragData.type === DragItemEnum.MediaItem ||
        dragData.type === DragItemEnum.MediaItemsMulti
      ) {
        const mediaData = dragData as MediaDragData;
        const itemIds = mediaData.itemIds;
        const overId = String(over.id);

        // Drop on Campaign
        const campaignId = resolveCampaignId(overId, overData);

        if (campaignId) {
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

        // Drop on Tab
        const tabValue = resolveTabValue(overId);
        if (tabValue) {
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

        // Reorder within grid - ONLY when manual order is enabled
        if (
          active.id !== over.id &&
          onReorderMedia &&
          canReorderMedia(orderBy, Boolean(galleryActions))
        ) {
          const items = galleryActions!.getGalleryItems();
          const currentIds = items.map((i) => i.id);
          const reorderData = computeReorderData(
            currentIds,
            itemIds,
            String(over.id)
          );

          if (reorderData) {
            onReorderMedia(reorderData);
            setSelectedItems([]);
          }
        }
        return;
      }

      // ========================================================================
      // Campaign Drop Handling
      // ========================================================================
      if (dragData.type === DragItemEnum.Campaign) {
        const campaignData = dragData as CampaignDragData;

        // Drop on Section (archive/unarchive)
        const targetSection = resolveSectionTarget(overData);
        if (targetSection) {
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
          const section = resolveCampaignSection(over.data.current as DragData);
          if (section) {
            try {
              await onReorderCampaigns(
                campaignData.campaignId,
                String(over.id).replace("campaign-", ""),
                "after", // Default to after, actual position calculated in handler
                section
              );
            } catch (error) {
              console.error("Failed to reorder campaigns:", error);
            }
          }
        }
      }
    },
    [
      selectedItems,
      galleryActions,
      orderBy,
      onMoveMediaToCampaign,
      onMoveMediaToTab,
      onReorderMedia,
      onReorderCampaigns,
      onArchiveCampaign,
      setSelectedItems,
    ]
  );

  // Build drag overlay content
  const dragOverlayContent = useMemo(() => {
    if (!activeId || !activeDragData) return null;

    if (
      activeDragData.type === DragItemEnum.MediaItem ||
      activeDragData.type === DragItemEnum.MediaItemsMulti
    ) {
      const mediaData = activeDragData as MediaDragData;
      const items = galleryActions?.getGalleryItems() || [];

      // Get preview items for all selected items
      const previewItems = items.filter((item) =>
        mediaData.itemIds.includes(item.id)
      );

      return (
        <MediaDragOverlay
          itemCount={mediaData.itemIds.length}
          previewItems={previewItems}
        />
      );
    }

    if (activeDragData.type === DragItemEnum.Campaign) {
      const campaignData = activeDragData as CampaignDragData;
      const campaign = campaigns.find((c) => c.id === campaignData.campaignId);

      return (
        <CampaignDragOverlay campaignTitle={campaign?.title || "Campaign"} />
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
    [
      activeId,
      activeDragData,
      overId,
      selectedItems,
      setSelectedItems,
      dragOverlayContent,
    ]
  );

  return (
    <GalleryDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={galleryCollisionDetection}
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
