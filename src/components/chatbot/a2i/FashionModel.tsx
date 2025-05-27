"use client";

import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDisplay } from "./ImageDisplay";
import { InfoRow } from "./InfoRow";
import { ActionButtonsRow } from "./ActionButtonsRow";

interface FashionModelProps {
  fashionModel: string;
  title?: string;
  details?: Record<string, string>;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
}

export function FashionModel({
  fashionModel,
  title = " HoYeon Jung",
  details = {
    Ethnicity: "East Asian",
    Skin: "Porcelain complexion",
    FacialFeatures: "Almond-shaped eyes, defined cheekbones, full lips",
    Hair: "Long, reddish-brown, center-parted, softly wavy and tousled",
    BodyType: "Tall and slender, with elegant proportions",
    Posture: "Upright and poised, fluid runway walk",
    Expression: "Neutral, composed — quiet confidence",
    Accessories: "Delicate hoop earrings, butterfly brooch at collar",
    Styling:
      "Layered shearling coat, knitwear, and pleated skirt — mix of texture and polish",
    OverallVibe:
      "Modern, intelligent femininity — elegant, thoughtful, and subtly powerful",
  },

  onSelect,
  onGoToGenerator,
}: FashionModelProps) {
  return (
    <ContentSection
      title={`Model : ${title}`}
      content={
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <ImageDisplay
              src={fashionModel}
              alt="Fashion Model"
              onSelect={onSelect}
            />
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
                  label: "Select Model",
                  onClick: onSelect,
                  color: "#EA916E",
                  hoverColor: "#e7845d",
                },
              ]}
            />
          </div>
          <div className="lg:col-span-3 ml-10 mt-6">
            <div className="space-y-2 text-sm ">
              {Object.entries(details).map(([label, value]) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
