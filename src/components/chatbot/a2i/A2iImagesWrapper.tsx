import { ContentSection } from "@/components/shared/ContentSection";
import { A2iImageGeneration } from "@/types/types";
import {
  A2iImageCard,
  A2iImageCardProps,
  A2iImagePlaceholderCard,
} from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import A2iImageModelSelector from "./A2iImageModelSelector";
import { useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { updateA2iImagePositions } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import A2iImageCardDraggable from "./A2iImageCardDraggable";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
  form: UseFormReturn<any>;
};

const INTIAL_IMAGE_PLACEHOLDER = 16;

export const A2iImagesWrapper = ({
  generations,
  form,
}: A2iImagesWrapperProps) => {
  const { selectedBrandId } = useBrandStore();
  const [items, setItems] = useState<A2iImageCardProps[]>([]);
  const isUpdatingServer = useRef(false);

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
              remixParameters: generation.remix_parameters,
              video: generation.video,
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
          remixParameters: generation.remix_parameters,
          video: generation.video,
        }));
      }
    );

    flatImages.sort((a, b) => {
      const aPos = a.image?.position ?? Infinity;
      const bPos = b.image?.position ?? Infinity;

      if (aPos !== bPos) return aPos - bPos;

      const aDate = new Date(a.image?.created_at ?? "").getTime();
      const bDate = new Date(b.image?.created_at ?? "").getTime();
      return bDate - aDate;
    });

    setItems(flatImages);
  }, [generations]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isUpdatingServer.current) return;

    const activeIndex = items.findIndex(
      (item) =>
        item.image?.id || item.video?.id || item.generationId === active.id
    );
    const overIndex = items.findIndex(
      (item) =>
        item.image?.id || item.video?.id || item.generationId === active.id
    );

    if (activeIndex === -1 || overIndex === -1) {
      console.warn("Invalid drag indices detected:", {
        activeId: active.id,
        overId: over.id,
        activeIndex,
        overIndex,
      });
      return;
    }

    if (activeIndex === overIndex) return;

    const newItems = arrayMove(items, activeIndex, overIndex);
    setItems(newItems);

    const updates = newItems
      .map((item, index) => ({
        item,
        newPosition: index,
      }))
      .filter(({ item }) => item.image !== null)
      .map(({ item, newPosition }) => ({
        image_id: item.image!.id,
        generation_id: item.generationId,
        position: newPosition,
      }));

    if (updates.length === 0) return;

    isUpdatingServer.current = true;
    try {
      await updateA2iImagePositions(selectedBrandId!, updates);
    } catch (error) {
      console.error("Failed to update image positions:", error);
      setItems(items); // rollback
      toast.error("Failed to save new order. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      isUpdatingServer.current = false;
    }
  };

  return (
    <ContentSection
      title=""
      customActions={<A2iImageModelSelector />}
      showCopy={false}
      showPin={false}
      context={{ data: {} }}
      content={
        <div className="relative h-[48rem] bg-muted rounded-md">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(
                (item) => item.image?.id || item.video?.id || item.generationId
              )}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] h-full relative overflow-y-auto scrollbar gap-[1px] content-start justify-center p-1">
                {items.map((image) => {
                  if (image.status === "completed") {
                    return (
                      <A2iImageCardDraggable
                        key={
                          image.image?.id ||
                          image.video?.id ||
                          image.generationId
                        }
                        imageData={image}
                      />
                    );
                  }

                  return (
                    <A2iImageCard
                      key={
                        image.image?.id || image.video?.id || image.generationId
                      }
                      {...image}
                    />
                  );
                })}

                {Array.from({
                  length: Math.max(0, INTIAL_IMAGE_PLACEHOLDER - items.length),
                }).map((_, index) => (
                  <A2iImagePlaceholderCard
                    key={`empty-placeholder-${items.length + index}`}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <A2iImageInput form={form} />
        </div>
      }
    />
  );
};
