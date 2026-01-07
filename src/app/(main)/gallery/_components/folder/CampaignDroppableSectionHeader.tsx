import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { useSectionDroppable } from "@/lib/gallery-dnd.utils";

// Droppable section header component
export function DroppableSectionHeader({
  section,
  label,
  count,
  className,
}: {
  section: "active" | "archived";
  label: string;
  count: number;
  className?: string;
}) {
  const droppableConfig = useSectionDroppable(section);
  const { setNodeRef, isOver } = useDroppable(droppableConfig);

  return (
    <span
      ref={setNodeRef}
      className={cn("flex-1", isOver && "text-purple-600 font-bold", className)}
    >
      {label} ({count})
    </span>
  );
}
