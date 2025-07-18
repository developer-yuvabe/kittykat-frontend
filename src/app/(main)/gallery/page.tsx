import React from "react";
import { MediaLibrary } from "./_components/MediaLibrary";
import { StreamProvider } from "@/providers/langgraph/Stream";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#F3F4F6FF] rounded-3xl m-4 p-4 md:p-6">
      <StreamProvider>
        <MediaLibrary activeTab="all-media" />
      </StreamProvider>
    </main>
  );
}
