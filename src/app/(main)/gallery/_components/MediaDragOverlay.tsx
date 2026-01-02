import { GalleryItemResponse } from "@/types/gallery.types";

interface MediaDragOverlayProps {
  itemCount: number;
  previewItems?: GalleryItemResponse[];
}

export function MediaDragOverlay({
  itemCount,
  previewItems = [],
}: MediaDragOverlayProps) {
  // MULTI-SELECT OVERLAY
  if (itemCount > 1) {
    const displayItems = previewItems.slice(0, 3);

    return (
      <div className="relative w-32 h-32">
        {displayItems.map((item, index) => {
          const isTop = index === 0;

          return (
            <div
              key={item.id}
              className={`
                absolute rounded-lg 
                border-2 border-purple-500 bg-white shadow-2xl
                w-[120px] h-[120px]
                ${index === 0 ? "top-0 left-0 z-30" : ""}
                ${index === 1 ? "top-2 left-2 z-20" : ""}
                ${index === 2 ? "top-4 left-4 z-10" : ""}
              `}
            >
              <div className="relative w-full h-full">
                <img
                  src={item.preview_url || item.asset_url}
                  alt={`Item ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* 🔒 Count badge pinned to FIRST image */}
                {isTop && (
                  <div
                    className="
                      absolute -top-2 -right-2 z-50
                      bg-purple-600 text-white
                      px-2.5 py-0.5
                      rounded-full
                      text-sm font-semibold
                      border-2 border-white
                      shadow-lg
                    "
                  >
                    {itemCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // SINGLE ITEM OVERLAY
  const previewItem = previewItems[0];

  return (
    <div className="relative w-32 h-32">
      {previewItem && (
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border-2 border-purple-500 bg-white">
          <img
            src={previewItem.preview_url || previewItem.asset_url}
            alt="Dragging"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
