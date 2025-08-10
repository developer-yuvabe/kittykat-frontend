import { Photo } from "react-photo-album";

import { useState } from "react";
import { Heart, Loader2, Maximize2, RotateCcw, X } from "lucide-react";
import Sortable from "./Sortable";
import { SortablePhoto } from "./CustomGalleryContainer";

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
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<TPhoto>[]>>;
  showLiked?: boolean;
};

export function CustomGalleryGridItem<TPhoto extends Photo>({
  photo,
  index,
  onPhotoLike,
  removedPhoto,
  onReplaceImage,
  hasUnsavedChanges,
  handleExpandImage,
  isDraggable,
  isAtMinimum,
  setPhotos,
  showLiked,
}: GridItemProps<TPhoto>) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAtMinimum) return;

    setIsRemoving(true);

    setTimeout(() => {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setIsRemoving(false);
    }, 150);
  };

  const content = (
    <div
      className={`relative group w-full h-full transition-all duration-200 ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isRemoving ? "scale-95 opacity-50" : "scale-100 opacity-100"} 
      } `}
    >
      {/* Inner padded wrapper to prevent clipping */}
      <div className="relative w-full h-full">
        <img
          src={photo.src}
          className={`w-full h-full object-cover transition-all duration-200 ${
            isRemoving ? "grayscale" : "grayscale-0"
          }`}
          draggable={false}
          loading="eager"
        />

        {/* Hover Overlay Gradient */}
        {(removedPhoto || onReplaceImage || onPhotoLike) && (
          <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 " />
          </div>
        )}

        {/* Top-left: Remove */}
        {removedPhoto && (
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

        {/* Bottom-left: Replace */}
        {onReplaceImage && hasUnsavedChanges === false && (
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
        {onPhotoLike && (
          <div
            className={`absolute bottom-2 right-2 z-10 ${
              showLiked && photo.liked
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } transition-opacity duration-200`}
          >
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
