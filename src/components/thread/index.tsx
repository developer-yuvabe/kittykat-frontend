import Logo from "@/assets/kittykat-logo.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useThreads } from "@/providers/langgraph/Thread";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";
import { ChatInput } from "../chatbot/ChatInput";
import { ChatMessageList } from "../chatbot/ChatMessageList";
import { ScrollToBottom } from "../chatbot/ScrollToBottom";
import { StickyToBottomContent } from "../chatbot/StickyToBottomContent";
import ThreadDetailsPanel from "../chatbot/ThreadDetailsPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { ChatSkeleton } from "./messages/message-skeleton";
import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";
import { ChatSuggestions } from "../chatbot/ChatSuggestions";
import { useBrandStore } from "@/store/brand.store";

export function Thread() {
  const { selectedBrandId, setSelectedBrandId } = useBrandStore();
  useBrandUpdates(selectedBrandId);
  const { threadsLoading } = useThreads();

  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const stream = useStreamContext();
  const messages = stream.messages;
  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        return;
      }
      lastError.current = message;
      console.log(message);
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first token received
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (stream.values.currentBrandContextId) {
      setSelectedBrandId(stream.values.currentBrandContextId);
    }
  }, [stream.values.currentBrandContextId]);

  const chatStarted = !!messages.length;

  return (
    <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden">
      <div className="w-full px-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex flex-1 h-full"
        >
          {/* Tool Results Panel - Left Side */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <ThreadDetailsPanel isLargeScreen={isLargeScreen} />
          </ResizablePanel>
          <ResizableHandle className="mx-3 bg-transparent" withHandle />
          <ResizablePanel defaultSize={30} minSize={30}>
            {/* Chat Area - Right Side */}
            <div
              className={cn(
                "flex-1 flex flex-col min-w-0 overflow-hidden relative h-full",
                !chatStarted && "grid-rows-[1fr]"
              )}
            >
              <StickToBottom className="relative justify-end flex-1 rounded-2xl bg-[#F3F4F6]">
                {threadsLoading ? (
                  <div className="absolute inset-0 px-4 overflow-y-scroll scrollbar">
                    <div className="pt-8 pb-2 ml-auto mr-0 flex flex-col gap-1 w-full">
                      <ChatSkeleton />
                    </div>
                  </div>
                ) : (
                  <StickyToBottomContent
                    className={cn(
                      "absolute inset-0 px-4 overflow-y-scroll scrollbar",
                      !chatStarted && "flex flex-col items-stretch mt-[15vh]",
                      chatStarted && "grid grid-rows-[1fr_auto]"
                    )}
                    contentClassName="pt-8 pb-2 ml-auto mr-0 flex flex-col gap-1 w-full"
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
                                src={Logo}
                                alt="KittyKat Logo"
                                width={100}
                                height={40}
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
}
