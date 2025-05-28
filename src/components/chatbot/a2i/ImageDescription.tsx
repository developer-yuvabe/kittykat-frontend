// components/ImageDescription.tsx

import { ContentSection } from "@/components/shared/ContentSection";

type ImageDescriptionProps = {
  imageDescription: string;
  setImageDescription: (value: string) => void;
};

export const ImageDescription = ({
  imageDescription,
  setImageDescription,
}: ImageDescriptionProps) => {
  return (
    <ContentSection
      title="Image Description"
      content={
        <div>
          <p className="text-sm text-[#171A1F]">{imageDescription}</p>
        </div>
      }
    />
  );
};
