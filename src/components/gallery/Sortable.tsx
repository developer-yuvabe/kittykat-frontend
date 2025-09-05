import { cloneElement, ReactElement, RefAttributes, useCallback } from "react";
import { useUnifiedSortable } from "@/contexts/CarouselDndContext";

type SortableProps = {
  id: string;
  droppableRef?: (element: HTMLElement | null) => void;
  children: ReactElement<
    RefAttributes<HTMLElement> & Record<`data-${string}`, unknown>
  >;
};

export default function Sortable({
  id,
  droppableRef,
  children,
}: SortableProps) {
  const {
    attributes,
    listeners,
    isDragging,
    index,
    activeIndex,
    over,
    setNodeRef,
  } = useUnifiedSortable(id);

  // Create a combined ref function that calls both setNodeRef and droppableRef
  const combinedRef = useCallback(
    (element: HTMLElement | null) => {
      setNodeRef(element);
      if (droppableRef) {
        droppableRef(element);
      }
    },
    [setNodeRef, droppableRef, id]
  );

  return cloneElement(children, {
    ref: combinedRef,
    "data-active": isDragging,
    "data-position":
      activeIndex >= 0 && over?.id === id && !isDragging
        ? index > activeIndex
          ? "after"
          : "before"
        : undefined,
    ...attributes,
    ...listeners,
  });
}
