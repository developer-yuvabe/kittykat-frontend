"use client";

import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDisplay } from "./ImageDisplay";
import { InfoRow } from "./InfoRow";
import { ActionButtonsRow } from "./ActionButtonsRow";

interface ProductProps {
  productImage: string;
  title?: string;
  details?: Record<string, string>;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
}

export function Product({
  productImage,
  title = "Lush Couture Blush Bloom Mini Dress",
  details = {
    ProductType: "Women’s sleeveless cocktail dress",
    ProductName: "Blush Bloom Mini Dress",
    Category: "Women's Cocktail & Evening Wear, Special Occasion Dresses",
    Brand: "Lush Couture",
    Color: "Vibrant hot pink — bold, saturated, and eye-catching",
    DesignDetails:
      "Fit-and-flare silhouette, high neckline with keyhole cutout and decorative bow, fitted bodice, full pleated skirt",
  },

  onSelect,
  onGoToGenerator,
}: ProductProps) {
  return (
    <ContentSection
      title={`Product : ${title}`}
      content={
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <ImageDisplay
              src={productImage}
              alt="Product"
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
                  label: "Select Product",
                  onClick: onSelect,
                  color: "#EA916E",
                  hoverColor: "#e7845d",
                },
              ]}
            />
          </div>
          <div className="lg:col-span-3 ml-10 mt-6">
            <div className="space-y-2 text-sm">
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
