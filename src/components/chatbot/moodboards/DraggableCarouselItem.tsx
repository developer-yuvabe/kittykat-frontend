"use client";

import React from "react";
import { useCarouselItemDraggable } from "@/contexts/CarouselDndContext";
import { GalleryItemResponse } from "@/types/gallery.types";

interface DraggableCarouselItemProps {
  item: GalleryItemResponse;
  children: React.ReactNode;
  className?: string;
}

export const DraggableCarouselItem: React.FC<DraggableCarouselItemProps> = ({
  item,
  children,
  className = "",
}) => {
  const { attributes, listeners, setNodeRef, isDragging } =
    useCarouselItemDraggable(item);

  // If no dragging functionality available, just render children
  const hasDragFunctionality = attributes && listeners && setNodeRef;

  if (!hasDragFunctionality) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`relative ${className} ${
        isDragging
          ? "opacity-60 cursor-grabbing transform rotate-1 scale-105 z-50"
          : "cursor-grab hover:scale-105 hover:shadow-lg"
      } transition-all duration-200`}
      style={{
        // Ensure the draggable maintains its transform
        transform: isDragging ? "rotate(2deg) scale(1.05)" : undefined,
      }}
      title={`Drag ${
        item.asset_title || "this image"
      } to a placeholder in the moodboard`}
    >
      {/* Drag hint overlay */}
      {!isDragging && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-md flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/90 text-gray-800 px-2 py-1 rounded text-xs font-medium">
            Drag to moodboard
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
