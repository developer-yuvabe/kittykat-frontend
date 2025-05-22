import { ContentSection } from "@/components/shared/ContentSection";
import { isValidUrl } from "@/lib/utils";

interface BrandLogosProps {
  logos?: string[];
}

export const BrandLogos: React.FC<BrandLogosProps> = ({ logos = [] }) => {
  const validLogos = logos.filter(isValidUrl);

  if (validLogos.length === 0) return null;

  return (
    <ContentSection
      title="Logos"
      content={
        <div className="flex flex-wrap gap-4 mt-2">
          {validLogos.map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`Logo ${index + 1}`}
              className="h-20 w-auto rounded-lg shadow-md"
              loading="lazy"
            />
          ))}
        </div>
      }
      context={{ logos: validLogos }}
    />
  );
};
