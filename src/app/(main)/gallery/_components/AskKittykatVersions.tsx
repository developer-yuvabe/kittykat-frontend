import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { galleryService } from "@/services/api/gallery.service";
import { GalleryItemResponse } from "@/types/gallery.types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import AddVersion from "./AddVersion";

type AskKittykatVersionsProps = {
  item: GalleryItemResponse;
};

const AskKittykatVersions = ({ item }: AskKittykatVersionsProps) => {
  const { isFetching, data } = useQuery({
    queryKey: ["versions", item.id],
    queryFn: () => galleryService.getGalleryItemVersions(item.id),
  });

  const addVersion = async () => {};

  return (
    <div>
      {isFetching ? (
        <div className="flex items-center gap-x-4 flex-row-reverse">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-4 w-24 bg-gray-300 animate-pulse"
              style={{ width: `${index * 100 + 50}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {data?.map((version, idx) => (
            <Button
              key={version.id}
              variant="outline"
              size="sm"
              className="p-0 h-auto"
              onClick={() => {}}
            >
              Version {idx + 1}
            </Button>
          ))}
          <AddVersion>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => {}}
            >
              +
            </Button>
          </AddVersion>
        </div>
      )}
    </div>
  );
};

export default AskKittykatVersions;
