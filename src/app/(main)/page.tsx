"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { useUserStore } from "@/store/user.store";

import { useEffect } from "react";

export default function Page() {
  const lastInteractedBrandId = useUserStore((state) =>
    state.getLastInteractedBrandId()
  );

  useEffect(() => {
    if (lastInteractedBrandId) {
      // Replace this with the actual logic to send the brand ID
      console.log("Sending last interacted brand ID:", lastInteractedBrandId);
      // e.g., fetch or socket message
    }
  }, [lastInteractedBrandId]);

  return (
    <div className="bg-white">
      <ThreadProvider>
        <StreamProvider>
          <Thread brandId={lastInteractedBrandId} />
        </StreamProvider>
      </ThreadProvider>
    </div>
  );
}
