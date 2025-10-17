"use client";

import type React from "react";

import type { Photo } from "react-photo-album";
import { useState } from "react";
import { Heart, Loader2, X } from "lucide-react";
import Sortable from "./Sortable";
import type { SortablePhoto } from "./CustomGalleryContainer";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { useBrandStore } from "@/store/brand.store";
import type { MoodboardInformation } from "@/types/types";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import Image from "next/image";

type GridItemProps<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  index: number;
  onPhotoLike?: (index: number, liked: boolean) => void;
  removedPhoto?: (id: string) => void;
  hasUnsavedChanges?: boolean;
  handleExpandImage: (photo: SortablePhoto<TPhoto>) => void;
  isDraggable: boolean;
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  showLiked?: boolean;
  isPreview?: boolean;
  moodboard: MoodboardInformation;
};

export function CustomGalleryGridItem<TPhoto extends Photo>({
  photo,
  index,
  onPhotoLike,
  removedPhoto,
  handleExpandImage,
  isDraggable,
  setItems,
  showLiked,
  isPreview,
  moodboard,
}: GridItemProps<TPhoto>) {
  const [isRemoving, setIsRemoving] = useState(false);
  const { selectedBrandId, isMoodboardSaving } = useBrandStore();

  const { updateAutoFillSuggestionCache, deprioritizeMutation } =
    useMoodboardQuery({
      brandId: selectedBrandId || undefined,
      campaignId: moodboard.campaign_id,
      moodboardId: moodboard.id,
      count: 50,
      enabled: false,
    });

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsRemoving(true);

    // Use mutation to deprioritize the image
    deprioritizeMutation.mutate([photo.id], {
      onSuccess: () => {
        setItems((prev) => {
          return prev.map((item) => {
            if (item.id === photo.id) {
              return {
                id: `placeholder-${item.position}`,
                width: 300,
                height: 300,
                is_placeholder: true,
                position: item.position,
                alt: `Placeholder ${item.position + 1}`,
              };
            }
            return item;
          });
        });
        setIsRemoving(false);
      },
      onError: () => {
        // Reset removing state on error
        setIsRemoving(false);
      },
    });
  };

  const handlePhotoLike = (index: number, liked: boolean) => {
    if (onPhotoLike) {
      onPhotoLike(index, liked);
    }

    updateAutoFillSuggestionCache(photo.id, liked);
  };

  const content = (
    <div
      className={`relative group w-full h-full transition-all duration-200 ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isRemoving ? "scale-95 opacity-50" : "scale-100 opacity-100"} 
      } `}
    >
      <div className="relative w-full h-full">
        <Image
          src={photo.src || "/placeholder.svg"}
          className={`w-full h-full object-cover transition-all duration-200 ${
            isRemoving ? "grayscale" : "grayscale-0"
          }`}
          draggable={false}
          loading="eager"
          alt={photo.alt || `Image ${photo.id}`}
          quality={20}
          fill
        />

        <div
          className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpandImage(photo);
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 cursor-pointer" />
        </div>

        {/* Draggable bar on top middle */}
        {isDraggable && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all opacity-60 hover:opacity-100" />
          </div>
        )}

        {removedPhoto && !isPreview && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isRemoving ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <X
                size={16}
                className="w-5 h-5 cursor-pointer transition-all duration-200 text-white fill-white hover:scale-110 active:scale-95"
                onClick={handleRemove}
              />
            )}
          </div>
        )}

        {onPhotoLike && !isPreview && (
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
              } hover:scale-110 active:scale-95 ${
                isMoodboardSaving && "opacity-50 "
              }`}
              onClick={(e) => {
                if (isMoodboardSaving) return;
                e.preventDefault();
                e.stopPropagation();
                handlePhotoLike(index, !photo.liked);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isDraggable) {
    return <Sortable id={photo.id}>{content}</Sortable>;
  }

  return content;
}
