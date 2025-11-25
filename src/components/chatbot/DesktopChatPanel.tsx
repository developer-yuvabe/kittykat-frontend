import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ThreadDetailsPanel from "./ThreadDetailsPanel";
import { StickToBottom } from "use-stick-to-bottom";
import { ChatSkeleton } from "../thread/messages/message-skeleton";
import { StickyToBottomContent } from "./StickyToBottomContent";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSuggestions } from "./ChatSuggestions";
import { ScrollToBottom } from "./ScrollToBottom";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import AgentDebug from "./AgentDebug";

interface DesktopChatPanelProps {
  layoutConfig: any;
  isLargeScreen: boolean;
  chatStarted: boolean;
  firstTokenReceived: boolean;
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>;
  prevMessageLength: React.MutableRefObject<number>;
}

const DesktopChatPanel: React.FC<DesktopChatPanelProps> = ({
  layoutConfig,
  isLargeScreen,
  chatStarted,
  firstTokenReceived,
  setFirstTokenReceived,
  prevMessageLength,
}) => {
  const [showChatPanel, setShowChatPanel] = useState(true);

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden relative",
        layoutConfig.containerHeight
      )}
    >
      <div className={cn("w-full", layoutConfig.containerPadding)}>
        {!showChatPanel && (
          <div className="fixed top-1/2 right-5 -translate-y-1/2 z-30">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center text-xl xl:text-3xl h-8 w-8 gap-2 bg-blue-600 hover:bg-blue-700 rounded-full"
                    onClick={() => setShowChatPanel(true)}
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Open chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <ResizablePanelGroup
          direction="horizontal"
          className="flex flex-1 h-full"
        >
          {/* Left: Thread Details */}
          <ResizablePanel
            defaultSize={layoutConfig.threadPanelDefault}
            minSize={layoutConfig.threadPanelMin}
            maxSize={layoutConfig.threadPanelMax}
          >
            <div className="relative h-full w-full">
              <ThreadDetailsPanel isLargeScreen={isLargeScreen} />
            </div>
          </ResizablePanel>

          {/* Show resizer and chat panel only if expanded */}
          {showChatPanel && (
            <>
              <ResizableHandle
                className={cn(
                  "relative bg-transparent",
                  layoutConfig.handleMargin
                )}
                withHandle
              />

              <ResizablePanel
                defaultSize={layoutConfig.chatPanelDefault}
                minSize={layoutConfig.chatPanelMin}
                maxSize={layoutConfig.chatPanelMax}
              >
                <div
                  className={cn(
                    "flex-1 flex flex-col min-w-0 overflow-hidden relative h-full",
                    !chatStarted && "grid-rows-[1fr]"
                  )}
                >
                  {/* Collapse button inside Chat Panel */}
                  <div className="absolute top-4 left-4 z-20">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white shadow-sm rounded-full"
                            onClick={() => setShowChatPanel(false)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Close chat</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <AgentDebug className="absolute top-4 right-4 z-20" />

                  <StickToBottom className="relative justify-end flex-1 rounded-2xl bg-[#F3F4F6]">
                    {false ? (
                      <div
                        className={cn(
                          "absolute inset-0 overflow-y-scroll scrollbar",
                          layoutConfig.contentPadding
                        )}
                      >
                        <div
                          className={cn(
                            layoutConfig.contentPaddingTop,
                            "pb-2 flex flex-col gap-1 w-full"
                          )}
                        >
                          <ChatSkeleton />
                        </div>
                      </div>
                    ) : (
                      <StickyToBottomContent
                        id="chat-panel-scroll-container"
                        className={cn(
                          "absolute inset-0 overflow-y-scroll scrollbar",
                          layoutConfig.contentPadding,
                          !chatStarted &&
                            cn(
                              "flex flex-col items-stretch",
                              layoutConfig.marginTop
                            )
                        )}
                        contentClassName={cn(
                          layoutConfig.contentPaddingTop,
                          "pb-2 ml-auto mr-0 flex flex-col gap-1 w-full",
                          chatStarted && "min-h-full"
                        )}
                        content={
                          <ChatMessageList
                            firstTokenReceived={firstTokenReceived}
                            setFirstTokenReceived={setFirstTokenReceived}
                            prevMessageLength={prevMessageLength}
                          />
                        }
                        footer={
                          <div className="sticky bottom-0 flex flex-col w-full bg-transparent rounded-2xl">
                            {!chatStarted && (
                              <>
                                <div className="flex justify-center">
                                  <ChatSuggestions
                                    setFirstTokenReceived={
                                      setFirstTokenReceived
                                    }
                                  />
                                </div>
                                <ScrollToBottom className="absolute mb-0 -translate-x-1/3 bottom-full right-1/4 animate-in fade-in-0 zoom-in-95" />
                              </>
                            )}

                            {
                              <ChatInput
                                setFirstTokenReceived={setFirstTokenReceived}
                              />
                            }
                          </div>
                        }
                      />
                    )}
                  </StickToBottom>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default DesktopChatPanel;
