import { ContentSection } from "@/components/shared/ContentSection";
import { A2iImageGeneration } from "@/types/types";
import {
  A2iImageCard,
  A2iImageCardProps,
  A2iImagePlaceholderCard,
} from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import A2iImageModelSelector from "./A2iImageModelSelector";
import { useMemo } from "react";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
};

const INTIAL_IMAGE_PLACEHOLDER = 16;

export const A2iImagesWrapper = ({ generations }: A2iImagesWrapperProps) => {
  const images = useMemo<A2iImageCardProps[]>(() => {
    const flatImages = generations.flatMap(
      (generation): A2iImageCardProps[] => {
        const images = generation.images;

        if (!images || images.length === 0) {
          return [
            {
              image: null,
              status: generation.status,
              generationId: generation.id,
              parameters: generation.parameters,
            },
          ];
        }

        return images.map((img) => ({
          image: img,
          status: generation.status,
          generationId: generation.id,
          parameters: generation.parameters,
        }));
      }
    );

    return flatImages.sort((a, b) => {
      const aPos = a.image?.position ?? Infinity;
      const bPos = b.image?.position ?? Infinity;

      if (aPos !== bPos) {
        return aPos - bPos;
      }

      const aCreated = a.image?.created_at ?? "";
      const bCreated = b.image?.created_at ?? "";

      return new Date(bCreated).getTime() - new Date(aCreated).getTime();
    });
  }, [generations]);

  return (
    <ContentSection
      title=""
      customActions={<A2iImageModelSelector />}
      showCopy={false}
      showPin={false}
      context={{
        data: {},
      }}
      content={
        <div className="relative h-[48rem] bg-muted rounded-md">
          <div
            className="grid grid-cols-[repeat(auto-fill,_minmax(15rem,_1fr))] h-full relative overflow-y-auto scrollbar gap-[1px] content-start justify-center
          "
          >
            {images.map((image, index) => (
              <A2iImageCard key={index} {...image} />
            ))}
            {Array.from({ length: INTIAL_IMAGE_PLACEHOLDER }).map(
              (_, index) => (
                <A2iImagePlaceholderCard key={index} />
              )
            )}
          </div>

          <A2iImageInput />
        </div>
      }
    />
  );
};
