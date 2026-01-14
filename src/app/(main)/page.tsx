"use client";
import React from "react";
import HeroSection from "./_components/HeroSection";
import { useThreadStore } from "@/store/thread.store";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import KittyKatAssistant from "./_components/KittyKatAssistant";
import { cn } from "@/lib/utils";
import BrandDetailsPanel from "@/components/chatbot/BrandDetailsPanel";

export default function Page() {
  const { showChatAssistant, setShowChatAssistant } = useThreadStore();

  return (
    <div className="relative">
      <div
        className={cn("", {
          "flex flex-row justify-between w-[calc(100vw-30rem)]":
            showChatAssistant,
          "w-full": !showChatAssistant,
        })}
      >
        <div className="w-full">
          <HeroSection />
          <BrandDetailsPanel isLargeScreen />
        </div>
        {showChatAssistant && <KittyKatAssistant />}
      </div>
      {!showChatAssistant && (
        <Button
          size="icon"
          onClick={() => setShowChatAssistant(true)}
          className="fixed rounded-full bottom-2 right-2 w-14 h-14"
        >
          <MessageSquare className="size-6" />
        </Button>
      )}
    </div>
  );
}
