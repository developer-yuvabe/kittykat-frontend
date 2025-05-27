import React from "react";
import { MediaLibrary } from "./_components/MediaLibrary";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F3F4F6FF] rounded-3xl m-4 p-4 md:p-6">
      <MediaLibrary activeTab="all-media" />
    </main>
  );
}
