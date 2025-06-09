import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const GallerySkeletonGrid = () => {
  const useCssMasonry = true;
  const [Masonry, setMasonry] = useState<any>(null);

  // Dynamically import react-masonry-css only if needed
  useEffect(() => {
    if (!useCssMasonry) {
      import("react-masonry-css").then((mod) => setMasonry(mod.default));
    }
  }, [useCssMasonry]);

  const skeletonItems = useMemo(() => {
    const aspectHeights = [
      300, 250, 350, 400, 300, 500, 300, 450, 375, 320, 280, 330,
    ];
    return aspectHeights.map((height, index) => ({
      id: `skeleton-${index}`,
      height,
    }));
  }, []);

  // ✅ Fast CSS Masonry (preferred)
  if (useCssMasonry) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {skeletonItems.map((item) => (
          <div
            key={item.id}
            className="break-inside-avoid mb-4 w-full"
            style={{ height: `${item.height}px` }}
          >
            <Skeleton className="w-full h-full rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // ⏳ Wait for dynamic Masonry load
  if (!Masonry) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading layout...
      </div>
    );
  }

  // 🧱 Fallback: JS Masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 2,
    500: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {skeletonItems.map((item) => (
        <div key={item.id} className="mb-4">
          <Skeleton
            className="w-full rounded-lg animate-pulse"
            style={{ height: `${item.height}px` }}
          />
        </div>
      ))}
    </Masonry>
  );
};

export default GallerySkeletonGrid;
