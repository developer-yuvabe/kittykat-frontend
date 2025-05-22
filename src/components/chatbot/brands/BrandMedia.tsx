import { ContentSection } from "@/components/shared/ContentSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { socialLinks } from "@/lib/icons";
import { isValidUrl } from "@/lib/utils";
import { ThreadBrand } from "@/types/types";
import { useCallback, useEffect, useMemo, useState } from "react";

interface BrandMediaProps {
  brand_media: ThreadBrand["brand_media"];
  socialMedia: {
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export const BrandMedia: React.FC<BrandMediaProps> = ({
  brand_media,
  socialMedia,
}) => {
  if (!Object.values(socialMedia).some((v) => v)) return null;

  const { posts, status } = useMemo(() => {
    return {
      posts: brand_media?.posts || [],
      status: brand_media?.status || null,
    };
  }, [brand_media]);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const shouldShowCarousel = status === "running" || status === "succeeded";

  const renderSkeletonItems = () =>
    Array.from({ length: 10 }).map((_, index) => (
      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
        <Skeleton className="flex aspect-square items-center justify-center p-6 rounded-md">
          <Loader className="fill-foreground" />
        </Skeleton>
      </CarouselItem>
    ));

  const renderPostItems = useCallback(
    () =>
      posts
        .filter((post) => post.url && isValidUrl(post.url))
        .map((post) => (
          <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3">
            <div
              className="relative overflow-hidden rounded-md h-[150px]"
              onClick={() => setExpandedImage(post.url)}
            >
              <img
                src={post.url || "/placeholder.svg"}
                alt={post.caption}
                className="flex aspect-square object-cover rounded-md"
              />
            </div>
          </CarouselItem>
        )),
    [posts]
  );

  return (
    <ContentSection
      title="Brand Media"
      content={
        <div className="relative">
          {status === "failed" && (
            <p className="text-sm text-destructive">
              We couldn’t retrieve data from the Instagram profile. This might
              be due to an incorrect URL, a private or empty profile, or access
              restrictions from Instagram (e.g., not a business account). Please
              take a moment to check the profile and try again.
            </p>
          )}

          {shouldShowCarousel && (
            <Carousel
              opts={{ align: "start", dragFree: true }}
              className="w-full mx-auto max-w-xl 2xl:max-w-3xl px-4 md:px-8 my-10"
            >
              <CarouselContent>
                {status === "running"
                  ? renderSkeletonItems()
                  : renderPostItems()}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-16 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/50 hover:text-white rounded-full text-white shadow-md border-none" />
              <CarouselNext className="absolute -right-16 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/50 hover:text-white rounded-full text-white shadow-md border-none" />
            </Carousel>
          )}

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
      context={{ brand_media, socialMedia }}
    />
  );
};
