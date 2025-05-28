"use client";

import { ImageDisplay } from "./ImageDisplay";
import { ContentSection } from "@/components/shared/ContentSection";
import { InfoRow } from "./InfoRow";
import { ActionButtonsRow } from "./ActionButtonsRow";

interface ReferenceImageSectionProps {
  referenceImage: string;
  title?: string;
  details?: Record<string, string>;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
}

export function ReferenceImage({
  referenceImage,
  title = "The Yellow Carebear",
  details = {
    Mood: "Wholesome, sunny, emotionally safe — childhood joy & parental warmth",
    Colors: "Bright yellows, soft oranges, warm creams, pastel sky blues",
    Subjects:
      "Children and parents bonding with plush toys — lots of smiles, hugs, and gentle interactions",
    Environments:
      "Cozy homes, soft-lit bedrooms, imaginative skies with stars and rainbows",
    Shots:
      "Centered compositions, close-ups on plush textures & facial expressions, wide shots of decorated rooms",
    Lighting:
      "Warm daylight and indoor golden glow — zero contrast, ultra-soft shadows",
    Tone: "Affectionate, innocent, pure comfort",
    NoGos: "No harsh lighting, no cold colors, no clutter",
  },

  onSelect,
  onGoToGenerator,
}: ReferenceImageSectionProps) {
  return (
    <ContentSection
      title={`Reference Image: ${title}`}
      content={
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <ImageDisplay
              src={referenceImage}
              alt="Reference Image"
              className="aspect-square"
              onSelect={onSelect}
            />
            <div className="">
              <ActionButtonsRow
                className="flex justify-between "
                buttons={[
                  {
                    label: "Go to Generator",
                    onClick: onGoToGenerator,
                    color: "#636AE8",
                    hoverColor: "#5b5fd1",
                  },
                  {
                    label: "Select Board",
                    onClick: onSelect,
                    color: "#EA916E",
                    hoverColor: "#e7845d",
                  },
                ]}
              />
            </div>
          </div>
          <div className="lg:col-span-3 mt-6 lg:ml-10">
            <div className="space-y-2 text-sm">
              {Object.entries(details).map(([key, value]) => (
                <InfoRow key={key} label={key} value={value} />
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
