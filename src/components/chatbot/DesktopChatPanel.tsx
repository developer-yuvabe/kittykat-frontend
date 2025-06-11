import React from "react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import Logo from "@/assets/kittykat-logo.svg";
import Image from "next/image";
import ThreadDetailsPanel from "./ThreadDetailsPanel";
import { StickToBottom } from "use-stick-to-bottom";
import { ChatSkeleton } from "../thread/messages/message-skeleton";
import { StickyToBottomContent } from "./StickyToBottomContent";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSuggestions } from "./ChatSuggestions";
import { ScrollToBottom } from "./ScrollToBottom";
import { ChatInput } from "./ChatInput";
import { useThreads } from "@/providers/langgraph/Thread";

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
  const { threadsLoading } = useThreads();

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden",
        layoutConfig.containerHeight
      )}
    >
      <div className={cn("w-full", layoutConfig.containerPadding)}>
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
            <ThreadDetailsPanel isLargeScreen={isLargeScreen} />
          </ResizablePanel>

          <ResizableHandle
            className={cn("bg-transparent", layoutConfig.handleMargin)}
            withHandle
          />

          {/* Right: Chat Panel */}
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
              <StickToBottom className="relative justify-end flex-1 rounded-2xl bg-[#F3F4F6]">
                {threadsLoading ? (
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
                    className={cn(
                      "absolute inset-0 overflow-y-scroll scrollbar",
                      layoutConfig.contentPadding,
                      !chatStarted &&
                        cn(
                          "flex flex-col items-stretch",
                          layoutConfig.marginTop
                        ),
                      chatStarted && "grid grid-rows-[1fr_auto]"
                    )}
                    contentClassName={cn(
                      layoutConfig.contentPaddingTop,
                      "pb-2 ml-auto mr-0 flex flex-col gap-1 w-full"
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
                            <div className="flex items-center justify-center gap-3">
                              <Image
                                src={Logo || "/placeholder.svg"}
                                alt="KittyKat Logo"
                                width={layoutConfig.logoSize.width}
                                height={layoutConfig.logoSize.height}
                                className="flex-shrink-0"
                              />
                            </div>
                            <div className="flex justify-center">
                              <ChatSuggestions
                                setFirstTokenReceived={setFirstTokenReceived}
                              />
                            </div>
                            <ScrollToBottom className="absolute mb-0 -translate-x-1/3 bottom-full right-1/4 animate-in fade-in-0 zoom-in-95" />
                          </>
                        )}

                        {!threadsLoading && (
                          <ChatInput
                            setFirstTokenReceived={setFirstTokenReceived}
                          />
                        )}
                      </div>
                    }
                  />
                )}
              </StickToBottom>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default DesktopChatPanel;
