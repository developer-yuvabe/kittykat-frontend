import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { A2iImageCard, A2iImageCardProps } from "./A2iImageCard";

function A2iImageCardDraggable({
  imageData,
}: {
  imageData: A2iImageCardProps;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: imageData.image?.id || imageData.video?.id || imageData.generationId,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <A2iImageCard
        {...imageData}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

export default A2iImageCardDraggable;
