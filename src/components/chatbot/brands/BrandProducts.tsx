import { ContentSection } from "@/components/shared/ContentSection";
import { Badge } from "@/components/ui/badge";

interface ProductsSectionProps {
  products: string[];
}

export const BrandProducts: React.FC<ProductsSectionProps> = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <ContentSection
      title="Products"
      content={
        <div className="flex flex-wrap gap-1 mt-1">
          {products.map((product, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-100"
            >
              {product}
            </Badge>
          ))}
        </div>
      }
      context={{ products }}
    />
  );
};
