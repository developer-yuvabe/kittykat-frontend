"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageCircle, ChevronUp } from "lucide-react";

import ThreadDetailsPanel from "./ThreadDetailsPanel";
import { ChatComponent } from "./ChatComponent";
import { useThreads } from "@/providers/langgraph/Thread";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface MobileChatPanelProps {
  chatStarted: boolean;
  firstTokenReceived: boolean;
  prevMessageLength: React.MutableRefObject<number>;
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileChatPanel: React.FC<MobileChatPanelProps> = ({
  chatStarted,
  firstTokenReceived,
  prevMessageLength,
  setFirstTokenReceived,
}) => {
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const { threadsLoading } = useThreads();
  return (
    <div className="flex flex-col w-full h-[calc(100vh-4rem)] overflow-hidden">
      <Sheet open={isChatDrawerOpen} onOpenChange={setIsChatDrawerOpen}>
        <SheetTrigger asChild>
          <div className="fixed top-1/2 right-1 -translate-y-1/2 z-30">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center text-xl xl:text-3xl h-8 w-8 gap-2 bg-blue-600 hover:bg-blue-700 rounded-full"
                  >
                    <ChevronUp className="w-4 h-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Open chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 rounded-t-2xl border-t-2"
        >
          <SheetHeader className="p-4 pb-2 border-b bg-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat Assistant
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 h-[calc(100%-4rem)]">
            <ChatComponent
              isMobile={true}
              chatStarted={chatStarted}
              firstTokenReceived={firstTokenReceived}
              prevMessageLength={prevMessageLength}
              setFirstTokenReceived={setFirstTokenReceived}
              threadsLoading={threadsLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ThreadDetailsPanel isLargeScreen={false} />
      </div>
    </div>
  );
};

export default MobileChatPanel;
