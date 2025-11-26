import React from "react";
import { MediaLibrary } from "./_components/MediaLibrary";

export default function Home() {
  return (
    <main className="min-h-[87.5vh] bg-[#F3F4F6FF] rounded-3xl mx-2 mt-2 p-4 md:p-6">
      <MediaLibrary activeTab="all-media" />
    </main>
  );
}
