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
    <div className="flex flex-col gap-y-4">
      {/* Product Reference Zone */}
      <ReferenceZone
        type="product"
        icon={Image}
        title="Product Reference"
        description="Use a product image (Drag or Click to add)"
        images={productReference}
        onClick={onProductReferenceClick}
        isSelected={false}
        onDragStart={(e, url) => onDragStart(e, url, "product")}
        onDrop={(e) => onDrop(e, "product")}
        onRemoveImage={(url) => onRemoveImage("product", url)}
        variant="carousel"
      />

      {/* Master Reference Zone */}
      <ReferenceZone
        type="master"
        icon={PanelTop}
        title="Master Reference"
        description="Use a master image (Drag or Click to add)"
        images={contextReference}
        onClick={onContextReferenceClick}
        isSelected={false}
        onDragStart={(e, url) => onDragStart(e, url, "master")}
        onDrop={(e) => onDrop(e, "master")}
        onRemoveImage={(url) => onRemoveImage("master", url)}
        variant="carousel"
      />
    </div>
  );
};
