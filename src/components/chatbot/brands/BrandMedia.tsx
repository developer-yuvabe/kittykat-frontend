import { ContentSection } from "@/components/shared/ContentSection";
import EmblaCarousel from "@/components/ui/embla-carousel";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { socialLinks } from "@/lib/icons";
import { isValidUrl } from "@/lib/utils";
import { ThreadBrand } from "@/types/types";
import React, { useMemo, useState } from "react";

interface BrandMediaProps {
  brandMedia: ThreadBrand["brand_media"];
  socialMedia: {
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export const BrandMedia: React.FC<BrandMediaProps> = ({
  brandMedia,
  socialMedia,
}) => {
  if (!Object.values(socialMedia || {}).some((v) => v)) return null;

  const { posts, status, message } = useMemo(() => {
    return {
      posts: brandMedia?.posts || [],
      status: brandMedia?.status || null,
      message: brandMedia?.message || "Failed to load brand media.",
    };
  }, [brandMedia]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const shouldShowCarousel = useMemo(
    () => status === "running" || status === "succeeded",
    [status]
  );

  return (
    <ContentSection
      title="Brand Media"
      content={
        <div className="relative">
          <div className="my-4">
            {status === "failed" && (
              <p className="text-sm text-destructive">{message}</p>
            )}

            {shouldShowCarousel &&
              (status === "succeeded" ? (
                <div className="flex justify-center">
                  <EmblaCarousel
                    data={posts}
                    renderItem={({ item }) => (
                      <div onClick={() => setExpandedImage(item.url)}>
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.caption}
                          className="object-cover"
                        />
                      </div>
                    )}
                    options={{ align: "center", loop: true }}
                  />
                </div>
              ) : (
                <EmblaCarousel
                  data={Array.from({ length: 10 })}
                  renderItem={({}) => (
                    <Skeleton className="w-full h-full flex items-center justify-center p-6 rounded-md">
                      <Loader className="fill-foreground" />
                    </Skeleton>
                  )}
                  options={{ align: "center", loop: true }}
                />
              ))}
          </div>

          {/* Contact Links */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            {socialLinks.map(({ platform, color, icon }) => {
              const url = socialMedia[platform as keyof typeof socialMedia];
              if (!isValidUrl(url)) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  className={`flex px-3 py-2 rounded-full items-center gap-1`}
                  style={{ backgroundColor: color }}
                  target="_blank"
                  rel="noreferrer"
                >
                  {icon}
                  <span>
                    {platform === "instagram"
                      ? "@" +
                        new URL(url).pathname.split("/").filter(Boolean).pop()
                      : platform === "website"
                      ? new URL(url).hostname.replace(/^www\./, "")
                      : new URL(url).pathname.split("/").filter(Boolean).pop()}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Expanded Image Modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <img
                src={expandedImage}
                alt="Expanded media"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </div>
          )}
        </div>
      }
      context={{ brandMedia, socialMedia }}
    />
  );
};
