import { ContentSection } from "@/components/shared/ContentSection";
import { A2iImageGeneration } from "@/types/types";
import { A2iImageCard, A2iImagePlaceholderCard } from "./A2iImageCard";
import A2iImageInput from "./A2iImageInput";
import A2iImageModelSelector from "./A2iImageModelSelector";

type A2iImagesWrapperProps = {
  generations: A2iImageGeneration[];
};

const INTIAL_IMAGE_PLACEHOLDER = 16;

export const A2iImagesWrapper = ({ generations }: A2iImagesWrapperProps) => {
  console.log("Rendering A2iImagesWrapper", generations);
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
            {generations.map((generation, index) => (
              <A2iImageCard key={index} generation={generation} />
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
