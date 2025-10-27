import { ContentSection } from "@/components/shared/ContentSection";
import EmblaCarousel from "@/components/ui/embla-carousel";
import { ExternalLink } from "lucide-react";
import { useBrandStore } from "@/store/brand.store";
import React, { useState } from "react";
import { useGalleryQuery } from "@/hooks/useGallery";
import Link from "next/link";
import { ImageModal } from "@/components/shared/ImageModal";
import { handleDownloadImage } from "@/lib/utils";

export const BrandMedia: React.FC = ({}) => {
  const { selectedBrandId } = useBrandStore();
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const { getGalleryItems, totalItems } = useGalleryQuery({
    selectedFilters: {
      brands: [selectedBrandId!],
      campaigns: [],
      moodboards: [],
      product_categories: [],
      asset_types: ["image"],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  const galleryItems = getGalleryItems();

  if (totalItems === 0) return null;

  return (
    <ContentSection
      title={`Brand Media`}
      content={
        <div className="relative">
          <div className="flex justify-between">
            <p className="text-xs font-semibold text-gray-500">
              {totalItems} Brand Images Found
            </p>
            <Link
              href="/gallery"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ExternalLink size={16} />
              View in Gallery
            </Link>
          </div>
          <div className="my-4">
            <div className="flex justify-center">
              <EmblaCarousel
                data={galleryItems}
                renderItem={({ item }) => (
                  <div
                    onClick={() =>
                      setSelectedImage({
                        url: item.preview_url || item.asset_url,
                        alt: item.asset_title,
                      })
                    }
                    className="cursor-pointer"
                  >
                    <img
                      src={
                        item.preview_url || item.asset_url || "/placeholder.svg"
                      }
                      alt={item.asset_title}
                      className="object-cover rounded-lg w-full h-64"
                    />
                  </div>
                )}
                options={{ align: "center", loop: true }}
              />
            </div>
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <ImageModal
              imageUrl={selectedImage.url}
              alt={selectedImage.alt}
              isOpen={!!selectedImage}
              onClose={() => setSelectedImage(null)}
              onDownload={() => handleDownloadImage(selectedImage.url)}
            />
          )}
        </div>
      }
    />
  );
};
