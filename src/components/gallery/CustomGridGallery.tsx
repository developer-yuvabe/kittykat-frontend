"use client";

import type React from "react";
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
import { Heart, X, RotateCcw, Maximize2, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

type OptimisticCustomGridGalleryProps<TPhoto extends Photo> = {
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
  isSyncing?: boolean;
  isPreview?: boolean;
};

const MIN_IMAGES_REQUIRED = 10;

export default function OptimisticCustomGridGallery<TPhoto extends Photo>({
  photos,
  movePhoto,
  onPhotoLike,
  removedPhoto,
  onReplaceImage,
  hasUnsavedChanges,
  isSyncing = false,
  isPreview = false,
}: OptimisticCustomGridGalleryProps<TPhoto>) {
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
      const oldIndex = photos.findIndex((photo) => photo.id === active.id);
      const newIndex = photos.findIndex((photo) => photo.id === over.id);
      movePhoto(oldIndex, newIndex);
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

  const handleRemovePhoto = (id: string) => {
    if (photos.length <= MIN_IMAGES_REQUIRED) {
      toast.info(
        `Minimum ${MIN_IMAGES_REQUIRED} images required for the moodboard`,
        {
          description: `You currently have ${photos.length} images. Add more images before removing any.`,
          duration: 4000,
        }
      );
      return;
    }
    if (removedPhoto) {
      removedPhoto(id);
    }
  };

  const handlePhotoLike = async (index: number, liked: boolean) => {
    if (onPhotoLike) {
      onPhotoLike(index, liked);
    }
  };

  const photoCount = photos.length;
  const layout =
    moodboardGridLayouts[photoCount as keyof typeof moodboardGridLayouts];

  const size = useResizeObserver<HTMLDivElement>({ ref });

  const containerHeight = (() => {
    if (!size.width || !layout) return 600; // fallback
    const rowCount = layout.containerClass.match(/grid-rows-(\d)/)
      ? Number.parseInt(layout.containerClass.match(/grid-rows-(\d)/)![1])
      : layout.containerClass.includes("grid-rows-[33%_33%_34%]")
      ? 3
      : 1;
    return (size.width * rowCount) / 6;
  })();

  const galleryContent = (
    <div className="relative">
      <div
        ref={ref}
        className={`w-full gap-1 grid ${
          layout.containerClass
        } transition-opacity duration-200 ${
          isSyncing ? "opacity-90" : "opacity-100"
        }`}
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
                onPhotoLike={handlePhotoLike}
                removedPhoto={handleRemovePhoto}
                onReplaceImage={onReplaceImage}
                hasUnsavedChanges={hasUnsavedChanges}
                handleExpandImage={handleExpandImage}
                isDraggable={isDraggable}
                isAtMinimum={photos.length <= MIN_IMAGES_REQUIRED}
                isSyncing={isSyncing}
                isPreview={isPreview}
              />
            </div>
          );
        })}
      </div>
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
  isAtMinimum: boolean;
  isSyncing?: boolean;
  isPreview: boolean;
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
  isAtMinimum,
  isSyncing = false,
  isPreview,
}: GridItemProps<TPhoto>) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAtMinimum || isSyncing) return;

    setIsRemoving(true);
    // Add a small delay to show the removing state
    setTimeout(() => {
      if (removedPhoto) {
        removedPhoto(photo.id);
      }
      setIsRemoving(false);
    }, 150);
  };

  const content = (
    <div
      className={`relative group w-full h-full transition-all duration-200 ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isRemoving ? "scale-95 opacity-50" : "scale-100 opacity-100"} ${
        isSyncing ? "pointer-events-none" : ""
      }`}
    >
      {/* Inner padded wrapper to prevent clipping */}
      <div className="relative w-full h-full">
        <img
          src={photo.src || "/placeholder.svg"}
          alt={photo.alt || `Image ${photo.id}`}
          className={`w-full h-full object-cover transition-all duration-200 ${
            isRemoving ? "grayscale" : "grayscale-0"
          }`}
          draggable={false}
          loading="eager"
        />

        {/* Hover Overlay Gradient */}
        {(removedPhoto || onReplaceImage || onPhotoLike) &&
          !isSyncing &&
          !isPreview && (
            <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 " />
            </div>
          )}

        {/* Top-left: Remove */}
        {removedPhoto && !isSyncing && !isPreview && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isRemoving ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <X
                size={16}
                className={`w-5 h-5 cursor-pointer transition-all duration-200 text-white fill-white hover:scale-110 active:scale-95 ${
                  isAtMinimum ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleRemove}
              />
            )}
          </div>
        )}

        {/* Top-right: Expand */}
        {!isSyncing && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Maximize2
              size={16}
              className="w-5 h-5 cursor-pointer transition-colors text-white hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExpandImage(photo);
              }}
            />
          </div>
        )}

        {/* Bottom-left: Replace */}
        {onReplaceImage &&
          hasUnsavedChanges === false &&
          !isSyncing &&
          !isPreview && (
            <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <RotateCcw
                size={16}
                className="w-5 h-5 cursor-pointer transition-colors text-white hover:scale-110 active:scale-95"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await onReplaceImage({
                    imageToReplaceId: photo.id,
                    replacementImageUrl: photo.src,
                  });
                }}
              />
            </div>
          )}

        {/* Bottom-right: Like */}
        {onPhotoLike && !isSyncing && !isPreview && (
          <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Heart
              size={16}
              className={`w-5 h-5 cursor-pointer transition-all duration-200 ${
                photo.liked ? "text-red-500 fill-red-500" : "text-white"
              } hover:scale-110 active:scale-95`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPhotoLike(index, !photo.liked);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Only wrap with Sortable if dragging is enabled
  if (isDraggable) {
    return <Sortable id={photo.id}>{content}</Sortable>;
  }

  return content;
}
