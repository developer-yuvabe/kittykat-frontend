"use client";
import React from "react";
import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/langgraph/Stream";
import Remix from "./_components/remix/Remix";

export default function Page() {
  return (
    <div className="mt-2">
      <StreamProvider>
        <Thread />
      </StreamProvider>
      <Remix />
    </div>
  );
}
