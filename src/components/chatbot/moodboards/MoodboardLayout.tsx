"use client";

import type { MoodboardInformation } from "@/types/types";
import type React from "react";
import "react-photo-album/rows.css";
import MoodboardContent from "./MoodboardContent";

interface MoodboardLayoutProps {
  moodboard: MoodboardInformation;
  brandId: string;
  carouselHeader?: React.ReactNode;
}

function MoodboardLayout({
  moodboard,
  brandId,
  carouselHeader,
}: MoodboardLayoutProps) {
  return (
    <div className="mt-4">
      <div>
        {/* Completed Gallery State */}
        <MoodboardContent
          moodboard={moodboard}
          brandId={brandId}
          carouselHeader={carouselHeader}
        />
      </div>
    </div>
  );
}

export default MoodboardLayout;
