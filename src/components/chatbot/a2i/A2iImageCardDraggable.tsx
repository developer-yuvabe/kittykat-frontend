import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { A2iImageCard, A2iImageCardProps } from "./A2iImageCard";
import { CSSProperties } from "react";

interface A2iImageCardDraggableProps {
  imageData: A2iImageCardProps;
  disableDrag?: boolean;
}

function A2iImageCardDraggable({
  imageData,
  disableDrag = false,
}: A2iImageCardDraggableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: imageData.image?.id || imageData.video?.id || imageData.generationId,
    disabled: disableDrag,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <A2iImageCard
        {...imageData}
        dragListeners={listeners}
        dragAttributes={attributes}
        isDragging={isDragging}
        disableDrag={disableDrag}
      />
    </div>
  );
}

export default A2iImageCardDraggable;
