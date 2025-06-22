import { ContentSection } from "@/components/shared/ContentSection";
import { A2iImageGeneration } from "@/types/types";
import {
  A2iImageCard,
  A2iImageCardProps,
  A2iImagePlaceholderCard,
} from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import A2iImageModelSelector from "./A2iImageModelSelector";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { updateA2iImagePositions } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import A2iImageCardDraggable from "./A2iImageCardDraggable";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
};

const INTIAL_IMAGE_PLACEHOLDER = 16;

export const A2iImagesWrapper = ({ generations }: A2iImagesWrapperProps) => {
  const { selectedBrandId } = useBrandStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);

  useEffect(() => {
    const flatImages = generations.flatMap(
      (generation): A2iImageCardProps[] => {
        const images = generation.images;
        if (!images || images.length === 0) {
          return [
            {
              image: null,
              status: generation.status,
              generationId: generation.id,
              parameters: generation.parameters,
              type: generation.type,
              vtonParameters: generation.vton_parameters,
            },
          ];
        }

        return images.map((img) => ({
          image: img,
          status: generation.status,
          generationId: generation.id,
          parameters: generation.parameters,
          type: generation.type,
          vtonParameters: generation.vton_parameters,
        }));
      }
    );

    flatImages.sort((a, b) => {
      const aPos = a.image?.position ?? Infinity;
      const bPos = b.image?.position ?? Infinity;

      if (aPos !== bPos) return aPos - bPos;

      const aCreated = new Date(a.image?.created_at ?? "").getTime();
      const bCreated = new Date(b.image?.created_at ?? "").getTime();
      return bCreated - aCreated;
    });

    setItems(flatImages);
  }, [generations]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.image?.id === active.id);
    const newIndex = items.findIndex((item) => item.image?.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const updates = items
      .filter((item) => item.image) // skip null image cards
      .map((item, index) => ({
        image_id: item.image!.id,
        generation_id: item.generationId,
        position: index,
      }));

    // persist with API
    await updateA2iImagePositions(selectedBrandId!, updates);
  };

  return (
    <ContentSection
      title=""
      customActions={<A2iImageModelSelector />}
      showCopy={false}
      showPin={false}
      context={{
        data: {},
      }}
      content={
        <div className="relative h-[48rem] bg-muted rounded-md">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.image?.id || item.generationId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] h-full relative overflow-y-auto scrollbar gap-[1px] content-start justify-center">
                {items.map((image) => {
                  if (image.status === "completed") {
                    return (
                      <A2iImageCardDraggable
                        key={image.image!.id}
                        imageData={image}
                      />
                    );
                  }

                  return <A2iImageCard key={image.generationId} {...image} />;
                })}
                {Array.from({ length: INTIAL_IMAGE_PLACEHOLDER }).map(
                  (_, index) => (
                    <A2iImagePlaceholderCard key={index} />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
          <A2iImageInput />
        </div>
      }
    />
  );
};
