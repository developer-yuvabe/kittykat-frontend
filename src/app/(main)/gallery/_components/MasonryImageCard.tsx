import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface MasonryImageCardProps {
  photo: {
    id: number;
    src: { original: string; medium: string };
    alt?: string | null;
  };
  isChecked: boolean;
  onToggle: () => void;
}

export function MasonryImageCard({
  photo,
  isChecked,
  onToggle,
}: MasonryImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    setDimensions({ width: target.naturalWidth, height: target.naturalHeight });
    setIsLoaded(true);
  };

  const aspectRatio = dimensions.width / dimensions.height || 1;
  const skeletonHeight = Math.floor(Math.random() * 200) + 200;

  return (
    <div
      key={photo.id}
      className="relative cursor-pointer overflow-hidden shadow-md group mb-4"
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggle}
          className="h-5 w-5 border-2 border-white data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black transition-all duration-200 hover:border-gray-200"
        />
      </div>

      {/* Skeleton loader */}
      {!isLoaded && (
        <Skeleton
          className="w-full rounded-lg"
          style={{ height: `${skeletonHeight}px` }}
        />
      )}

      {/* Image with smooth reveal */}
      <div
        className={`relative w-full transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0 absolute"
        }`}
        style={{
          paddingBottom: isLoaded ? `${(1 / aspectRatio) * 100}%` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <img
            src={photo.src.medium}
            alt={photo.alt ?? ""}
            onLoad={handleImageLoad}
            className="w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
