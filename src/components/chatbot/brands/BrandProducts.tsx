import { ContentSection } from "@/components/shared/ContentSection";
import { InlineEditableBadges } from "@/components/shared/InlineEditableBadges";
import { formatUpdateArrayMessage } from "@/lib/langgraph.utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { Agents } from "@/types/types";
import React from "react";

interface ProductsSectionProps {
  products: string[];
}

export const BrandProducts: React.FC<ProductsSectionProps> = ({ products }) => {
  if (!products || products.length === 0) return null;
  const stream = useStreamContext();
  return (
    <ContentSection
      title="Products"
      content={
        <div className="flex flex-wrap gap-1 mt-1">
          <InlineEditableBadges
            label="Products"
            values={products}
            onSave={async (newProducts) => {
              const message = formatUpdateArrayMessage(
                "products", // fieldPath
                products, // old value
                newProducts, // new value
                "BrandingAgent", // optional agent hint
                "Products" // pretty label
              );

              if (message) {
                submitOptimisticMessage({
                  stream,
                  text: message,
                });
              }
            }}
            showLabel={false}
          />
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          products,
        },
      }}
    />
  );
};
