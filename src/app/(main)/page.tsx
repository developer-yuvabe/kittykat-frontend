"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { useUserStore } from "@/store/user.store";

import { useEffect } from "react";

export default function Page() {
  return (
    <div className="bg-white">
      <ThreadProvider>
        <StreamProvider>
          <Thread brandId={null} />
        </StreamProvider>
      </ThreadProvider>
    </div>
  );
}
