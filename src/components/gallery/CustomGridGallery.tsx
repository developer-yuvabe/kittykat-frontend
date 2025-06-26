"use client";

import { useRef, useState } from "react";
import type { Photo } from "react-photo-album";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Heart, X, RotateCcw, Maximize2 } from "lucide-react";
import { ImageModal } from "../shared/ImageModal";
import Overlay from "./Overlay";
import Sortable from "./Sortable";
import { moodboardGridLayouts } from "@/lib/moodboard.utils";
import { useResizeObserver } from "@/hooks/useResizeObserver";

export type SortablePhoto<TPhoto extends Photo> = TPhoto & {
  id: string;
  liked?: boolean;
};

type ActivePhoto<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  width: number;
  height: number;
  padding?: string;
};

type CustomGridGalleryProps<TPhoto extends Photo> = {
  photos: SortablePhoto<TPhoto>[];
  movePhoto?: (oldIndex: number, newIndex: number) => void;
  onPhotoLike?: (index: number, liked: boolean) => void;
  removedPhoto?: (id: string) => void;
  onReplaceImage?: ({
    imageToReplaceId,
    replacementImageUrl,
  }: {
    imageToReplaceId: string;
    replacementImageUrl: string;
  }) => Promise<void>;
  hasUnsavedChanges?: boolean;
};

export default function CustomGridGallery<TPhoto extends Photo>({
  photos,
  movePhoto,
  onPhotoLike,
  removedPhoto,
  onReplaceImage,
  hasUnsavedChanges,
}: CustomGridGalleryProps<TPhoto>) {
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [activePhoto, setActivePhoto] = useState<ActivePhoto<TPhoto>>();
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Only enable drag functionality if both movePhoto and hasUnsavedChanges are provided
  const isDraggable =
    movePhoto !== undefined && hasUnsavedChanges !== undefined;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
      movePhoto(
        photos.findIndex((photo) => photo.id === active.id),
        photos.findIndex((photo) => photo.id === over.id)
      );
    }
    setActivePhoto(undefined);
  };

  const handleExpandImage = (photo: SortablePhoto<TPhoto>) => {
    setExpandedImage({
      url: photo.src,
      alt: photo.alt || `Image ${photo.id}`,
    });
  };

  const handleCloseModal = () => {
    setExpandedImage(null);
  };

  const photoCount = photos.length;
  const layout =
    moodboardGridLayouts[photoCount as keyof typeof moodboardGridLayouts];

  const size = useResizeObserver<HTMLDivElement>({ ref });

  const containerHeight = (() => {
    if (!size.width || !layout) return 600; // fallback

    // Example: estimate height by number of grid rows
    const rowCount = layout.containerClass.match(/grid-rows-(\d)/)
      ? parseInt(layout.containerClass.match(/grid-rows-(\d)/)![1])
      : layout.containerClass.includes("grid-rows-[33%_33%_34%]")
      ? 3
      : 1;

    return (size.width * rowCount) / 6;
  })();

  const galleryContent = (
    <div
      ref={ref}
      className={`w-full gap-1 grid ${layout.containerClass}`}
      style={{ height: `${containerHeight}px` }}
    >
      {photos.map((photo, index) => {
        const position = layout.positions[index];
        if (!position) return null;

        return (
          <div
            key={photo.id}
            style={{ gridArea: position.gridArea }}
            className="relative overflow-hidden"
          >
            <GridItem
              photo={photo}
              index={index}
              onPhotoLike={onPhotoLike}
              removedPhoto={removedPhoto}
              onReplaceImage={onReplaceImage}
              hasUnsavedChanges={hasUnsavedChanges}
              handleExpandImage={handleExpandImage}
              isDraggable={isDraggable}
            />
          </div>
        );
      })}
    </div>
  );

  // Only wrap with DndContext if dragging is enabled
  if (isDraggable) {
    return (
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        collisionDetection={closestCenter}
      >
        <SortableContext items={photos}>{galleryContent}</SortableContext>

        <DragOverlay>{activePhoto && <Overlay {...activePhoto} />}</DragOverlay>

        {expandedImage && (
          <ImageModal
            imageUrl={expandedImage.url}
            alt={expandedImage.alt}
            isOpen={!!expandedImage}
            onClose={handleCloseModal}
          />
        )}
      </DndContext>
    );
  }

  // Return gallery without drag functionality
  return (
    <>
      {galleryContent}
      {expandedImage && (
        <ImageModal
          imageUrl={expandedImage.url}
          alt={expandedImage.alt}
          isOpen={!!expandedImage}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

type GridItemProps<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  index: number;
  onPhotoLike?: (index: number, liked: boolean) => void;
  removedPhoto?: (id: string) => void;
  onReplaceImage?: ({
    imageToReplaceId,
    replacementImageUrl,
  }: {
    imageToReplaceId: string;
    replacementImageUrl: string;
  }) => Promise<void>;
  hasUnsavedChanges?: boolean;
  handleExpandImage: (photo: SortablePhoto<TPhoto>) => void;
  isDraggable: boolean;
};

function GridItem<TPhoto extends Photo>({
  photo,
  index,
  onPhotoLike,
  removedPhoto,
  onReplaceImage,
  hasUnsavedChanges,
  handleExpandImage,
  isDraggable,
}: GridItemProps<TPhoto>) {
  const content = (
    <div
      className={`relative group ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      } w-full h-full min-w-36`}
    >
      <img
        src={photo.src || "/placeholder.svg"}
        alt={photo.alt || `Image ${photo.id}`}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        draggable={false}
        loading="lazy"
      />

      {/* Gradient overlays - only show if there are hover actions */}
      {(removedPhoto || onReplaceImage || onPhotoLike) && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1/5 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </>
      )}

      {/* Delete Icon (top-left) - only render if removedPhoto is provided */}
      {removedPhoto && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <X
            size={16}
            className="w-5 h-5 cursor-pointer transition-colors text-white fill-white hover:scale-110 active:scale-95"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              removedPhoto(photo.id);
            }}
          />
        </div>
      )}

      {/* Expand Icon (top-right) - always available */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Maximize2
          size={16}
          className="w-5 h-5 cursor-pointer transition-colors text-white hover:scale-110 active:scale-95"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleExpandImage(photo);
          }}
        />
      </div>

      {/* Regenerate Icon (bottom-left) - only render if onReplaceImage is provided and hasUnsavedChanges is false */}
      {onReplaceImage && hasUnsavedChanges === false && (
        <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <RotateCcw
            size={16}
            className="w-5 h-5 cursor-pointer transition-colors text-white hover:scale-110 active:scale-95"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await onReplaceImage({
                imageToReplaceId: photo.id,
                replacementImageUrl: photo.src,
              });
            }}
          />
        </div>
      )}

      {/* Like Icon (bottom-right) - only render if onPhotoLike is provided */}
      {onPhotoLike && (
        <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Heart
            size={16}
            className={`w-5 h-5 cursor-pointer transition-colors ${
              photo.liked
                ? "text-red-500 fill-red-500"
                : "text-white fill-white"
            } hover:scale-110 active:scale-95`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onPhotoLike(index, !photo.liked);
            }}
          />
        </div>
      )}
    </div>
  );

  // Only wrap with Sortable if dragging is enabled
  if (isDraggable) {
    return <Sortable id={photo.id}>{content}</Sortable>;
  }

  return content;
}
