import type React from "react";
import type { Photo } from "react-photo-album";
import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { SortablePhoto } from "./CustomGalleryContainer";

type ActivePhoto<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  width: number;
  height: number;
  padding?: string;
};

interface UseDragHandlersProps<TPhoto extends Photo> {
  photos: SortablePhoto<TPhoto>[];
  ref: React.RefObject<HTMLDivElement>;
  isDraggable: boolean;
  movePhoto?: (oldIndex: number, newIndex: number) => void;
  setActivePhoto: React.Dispatch<
    React.SetStateAction<ActivePhoto<TPhoto> | undefined>
  >;
}

interface UseImageModalProps {
  setExpandedImage: React.Dispatch<
    React.SetStateAction<{
      url: string;
      alt: string;
    } | null>
  >;
}

export class CustomGalleryHooks {
  static useDragSensors() {
    const sensors = useSensors(
      useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
      useSensor(TouchSensor, {
        activationConstraint: { delay: 100, tolerance: 10 },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    return { sensors };
  }

  static useDragHandlers<TPhoto extends Photo>({
    photos,
    ref,
    isDraggable,
    movePhoto,
    setActivePhoto,
  }: UseDragHandlersProps<TPhoto>) {
    const handleDragStart = ({ active }: DragStartEvent) => {
      if (!isDraggable) return;
      const photo = photos.find((item) => item.id === active.id);
      const image = ref.current?.querySelector(`img[src="${photo?.src}"]`);
      const padding = image?.parentElement
        ? getComputedStyle(image.parentElement).padding
        : undefined;
      const { width, height } = image?.getBoundingClientRect() || {};
      if (photo !== undefined && width !== undefined && height !== undefined) {
        setActivePhoto({ photo, width, height, padding });
      }
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
      if (!isDraggable || !movePhoto) return;
      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((photo) => photo.id === active.id);
        const newIndex = photos.findIndex((photo) => photo.id === over.id);
        movePhoto(oldIndex, newIndex);
      }
      setActivePhoto(undefined);
    };

    return { handleDragStart, handleDragEnd };
  }

  static useImageModal<TPhoto extends Photo>({
    setExpandedImage,
  }: UseImageModalProps) {
    const handleExpandImage = (photo: SortablePhoto<TPhoto>) => {
      setExpandedImage({
        url: photo.src,
        alt: photo.alt || `Image ${photo.id}`,
      });
    };

    const handleCloseModal = () => {
      setExpandedImage(null);
    };

    return { handleExpandImage, handleCloseModal };
  }
}
