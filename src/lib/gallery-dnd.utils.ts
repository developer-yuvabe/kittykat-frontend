// gallery-dnd.utils.ts
import {
  DragItemEnum,
  DropTargetEnum,
  type DragData,
  type MediaDragData,
  type CampaignDragData,
  type DropTargetData,
} from "../types/gallery-dnd.types";
import type { UniqueIdentifier } from "@dnd-kit/core";
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";

/**
 * Normalize drag data to include multi-selection when applicable
 */
export function resolveActiveDragData(
  activeId: UniqueIdentifier,
  rawDragData: DragData | undefined,
  selectedItems: string[]
): DragData | null {
  if (!rawDragData) return null;

  if (
    rawDragData.type === DragItemEnum.MediaItem &&
    selectedItems.includes(String(activeId))
  ) {
    return {
      ...rawDragData,
      type:
        selectedItems.length > 1
          ? DragItemEnum.MediaItemsMulti
          : DragItemEnum.MediaItem,
      itemIds: selectedItems,
    } as MediaDragData;
  }

  return rawDragData;
}

/**
 * Extract campaignId from droppable target
 */
export function resolveCampaignId(
  overId: string,
  overData?: DropTargetData | DragData
): string | null {
  if (
    overData &&
    "type" in overData &&
    overData.type === DropTargetEnum.Campaign &&
    "campaignId" in overData
  ) {
    return (overData as unknown as CampaignDragData).campaignId;
  }

  if (overId.startsWith("campaign-")) {
    return overId.replace("campaign-", "");
  }

  return null;
}

/**
 * Resolve tab value from droppable id
 */
export function resolveTabValue(overId: string): string | null {
  if (!overId.startsWith("tab-")) return null;
  return overId.replace("tab-", "");
}

export const galleryCollisionDetection: CollisionDetection = (args) => {
  const { active } = args;

  const isMediaDrag =
    active.data.current?.type === DragItemEnum.MediaItem ||
    active.data.current?.type === DragItemEnum.MediaItemsMulti;

  // 1️⃣ Prioritize sidebar / non-grid targets
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const priorityTargets = pointerCollisions.filter((c) => {
      const data = c.data?.droppableContainer?.data?.current;
      return (
        data?.type === DropTargetEnum.Campaign ||
        data?.type === DropTargetEnum.Tab ||
        data?.type === DropTargetEnum.Section
      );
    });

    if (priorityTargets.length > 0) {
      return priorityTargets;
    }
  }

  // 2️⃣ Grid reordering
  if (isMediaDrag) {
    return closestCenter(args);
  }

  // 3️⃣ Fallback
  return rectIntersection(args);
};

/**
 * Resolve section target from drop data
 */
export function resolveSectionTarget(
  overData?: DropTargetData | DragData
): "active" | "archived" | null {
  if (
    overData &&
    "type" in overData &&
    overData.type === DropTargetEnum.Section
  ) {
    return (overData as DropTargetData).id as "active" | "archived";
  }
  return null;
}

/**
 * Resolve campaign section from campaign drag data
 */
export function resolveCampaignSection(
  overData?: DragData
): "active" | "archived" | null {
  if (overData?.type === DragItemEnum.Campaign) {
    const campaignData = overData as CampaignDragData;
    return campaignData.isArchived ? "archived" : "active";
  }
  return null;
}

/**
 * Check if media can be reordered
 */
export function canReorderMedia(orderBy?: string, hasGalleryActions?: boolean) {
  return orderBy === "brand_sort_order" && Boolean(hasGalleryActions);
}

/**
 * Create campaign sortable data configuration
 */
export function createCampaignSortableData(
  campaignId: string,
  isArchived: boolean
) {
  return {
    type: DragItemEnum.Campaign,
    campaignId,
    isArchived,
  };
}

/**
 * Check if campaign is a media drop target
 */
export function isCampaignDropTarget(
  campaignId: string,
  overId: UniqueIdentifier | null,
  activeDragData: DragData | null,
  isDroppableOver: boolean
): boolean {
  const isMediaDrag =
    activeDragData?.type === DragItemEnum.MediaItem ||
    activeDragData?.type === DragItemEnum.MediaItemsMulti;

  return (
    isDroppableOver ||
    (isMediaDrag &&
      (overId === campaignId || overId === `campaign-${campaignId}`))
  );
}

/**
 * Combine multiple refs into a single ref callback
 */
export function combineRefs<T>(
  ...refs: Array<
    ((node: T | null) => void) | React.MutableRefObject<T | null> | null
  >
) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    });
  };
}

// ============================================================================
// Droppable Configuration Hooks
// ============================================================================

/**
 * Campaign droppable configuration for receiving media items
 */
export function useCampaignDroppable(campaignId: string) {
  return {
    id: `campaign-${campaignId}`,
    data: {
      type: DropTargetEnum.Campaign,
      id: campaignId,
      accepts: [DragItemEnum.MediaItem, DragItemEnum.MediaItemsMulti],
    },
  };
}

/**
 * Tab droppable configuration for receiving media items
 */
export function useTabDroppable(tabValue: string) {
  return {
    id: `tab-${tabValue}`,
    data: {
      type: DropTargetEnum.Tab,
      id: tabValue,
      accepts: [DragItemEnum.MediaItem, DragItemEnum.MediaItemsMulti],
    },
  };
}

/**
 * Section droppable configuration for receiving campaigns
 */
export function useSectionDroppable(section: "active" | "archived") {
  return {
    id: `section-${section}`,
    data: {
      type: DropTargetEnum.Section,
      id: section,
      accepts: [DragItemEnum.Campaign],
    },
  };
}
