"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { A2iImageCard, type A2iImageCardProps } from "./A2iImageCard";
import { type CSSProperties, memo } from "react";

interface A2iImageCardDraggableProps {
  imageData: A2iImageCardProps;
  disableDrag?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

const A2iImageCardDraggable = memo(function A2iImageCardDraggable({
  imageData,
  disableDrag = false,
  isSelected,
  onSelect,
  selectionMode,
}: A2iImageCardDraggableProps) {
  // Get existing ID only - no fallback generation
  const existingId = imageData.image?.id || imageData.video?.id;

  // Don't use sortable if no existing ID
  const shouldUseSortable = Boolean(existingId) && !disableDrag;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: existingId || "no-id", // Fallback for useSortable hook
    disabled: !shouldUseSortable,
  });

  const style: CSSProperties = shouldUseSortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition || undefined,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
      }
    : {};

  return (
    <div
      ref={shouldUseSortable ? setNodeRef : undefined}
      style={style}
      className="relative"
    >
      <A2iImageCard
        {...imageData}
        dragListeners={shouldUseSortable ? listeners : undefined}
        dragAttributes={shouldUseSortable ? attributes : undefined}
        isDragging={isDragging}
        disableDrag={!shouldUseSortable}
        isSelected={isSelected}
        onSelect={onSelect}
        selectionMode={selectionMode}
      />
    </div>
  );
});

export default A2iImageCardDraggable;
