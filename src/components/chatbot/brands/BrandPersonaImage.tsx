import { ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface BrandPersonaImageProps {
  imageUrl?: string;
  name: string;
  isGenerating: boolean;
}

export function BrandPersonaImage({
  imageUrl,
  name,
  isGenerating,
}: BrandPersonaImageProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = imageUrl && !imageError && !isGenerating;

  return (
    <div className="relative w-full h-64 rounded-md overflow-hidden bg-muted flex items-center justify-center">
      {/* 🔄 Center Loader on Grey Background */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 🖼️ Show Image */}
      {showImage && (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* ❌ Fallback When No Image */}
      {!showImage && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ImageIcon className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              No Image
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
