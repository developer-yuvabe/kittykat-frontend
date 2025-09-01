"use client";

import type { MoodboardInformation } from "@/types/types";
import type React from "react";
import "react-photo-album/rows.css";
import MoodboardContent from "./MoodboardContent";
import { forwardRef } from "react";
import { CustomGalleryGridRef } from "@/components/gallery/CustomGalleryGrid";

interface MoodboardLayoutProps {
  moodboard: MoodboardInformation;
  brandId: string;
  carouselHeader?: React.ReactNode;
}

const MoodboardLayout = forwardRef<CustomGalleryGridRef, MoodboardLayoutProps>(
  ({ moodboard, brandId, carouselHeader }, ref) => {
    return (
      <div className="mt-4">
        <div>
          {/* Completed Gallery State */}
          <MoodboardContent
            ref={ref}
            moodboard={moodboard}
            brandId={brandId}
            carouselHeader={carouselHeader}
          />
        </div>
      </div>
    );
  }
);

MoodboardLayout.displayName = "MoodboardLayout";

export default MoodboardLayout;
