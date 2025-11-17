import { ReferenceZone } from "./ReferenceZone";
import { PanelTop, Image } from "lucide-react";
import React from "react";

interface A2iAdvancedPromptReferenceZonesProps {
  productReference: string[];
  contextReference: string[];
  onProductReferenceClick: () => void;
  onContextReferenceClick: () => void;
  onDragStart: (
    e: React.DragEvent,
    url: string,
    source: "product" | "master"
  ) => void;
  onDrop: (e: React.DragEvent, zone: "product" | "master") => void;
  onRemoveImage: (zone: "product" | "master", url: string) => void;
}

export const A2iAdvancedPromptReferenceZones: React.FC<
  A2iAdvancedPromptReferenceZonesProps
> = ({
  productReference,
  contextReference,
  onProductReferenceClick,
  onContextReferenceClick,
  onDragStart,
  onDrop,
  onRemoveImage,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Product Reference Zone */}
      <ReferenceZone
        type="product"
        icon={Image}
        title="Product Reference"
        description="Add product images to guide the generation.
      (Click to add or drag and drop images here.)"
        images={productReference}
        onClick={onProductReferenceClick}
        isSelected={false}
        onDragStart={(e, url) => onDragStart(e, url, "product")}
        onDrop={(e) => onDrop(e, "product")}
        onRemoveImage={(url) => onRemoveImage("product", url)}
        variant="tall"
      />

      {/* Context Reference Zone (Master Reference) */}
      <ReferenceZone
        type="master"
        icon={PanelTop}
        title="Context Reference"
        description="Add context/style images to guide the generation. 
        (Click to add or drag and drop images here.)"
        images={contextReference}
        onClick={onContextReferenceClick}
        isSelected={false}
        onDragStart={(e, url) => onDragStart(e, url, "master")}
        onDrop={(e) => onDrop(e, "master")}
        onRemoveImage={(url) => onRemoveImage("master", url)}
        variant="tall"
      />
    </div>
  );
};
