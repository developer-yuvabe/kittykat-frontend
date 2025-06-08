"use client";
import React from "react";
import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/langgraph/Stream";
import { ThreadProvider } from "@/providers/langgraph/Thread";

export default function Page() {
  return (
    <div className="mt-2">
      <ThreadProvider>
        <StreamProvider>
          <Thread />
        </StreamProvider>
      </ThreadProvider>
    </div>
  );
}
