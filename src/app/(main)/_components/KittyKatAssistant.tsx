import AgentDebug from "@/components/chatbot/AgentDebug";
import { ChatInput } from "@/components/chatbot/ChatInput";
import { ChatMessageList } from "@/components/chatbot/ChatMessageList";
import { StickyToBottomContent } from "@/components/chatbot/StickyToBottomContent";
import { HumanMessage } from "@/components/thread/messages/human";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useThreadStore } from "@/store/thread.store";
import { PanelRightClose, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StickToBottom } from "use-stick-to-bottom";

const KittyKatAssistant = () => {
  const { setShowChatAssistant } = useThreadStore();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  // Responsive breakpoints

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

  const chatStarted = useMemo(() => !!messages.length, [messages.length]);

  return (
    <div className="h-[calc(100vh-6rem)] w-120 border-l flex flex-col justify-between fixed right-0 bg-background">
      <div className="py-2 px-3 border-b">
        <div className="flex justify-between items-center gap-x-4">
          <div className="flex items-center gap-2">
            <div className="bg-brand-secondary/10 rounded-full p-2">
              <Sparkles className="text-brand-secondary size-4" />
            </div>
            <h2 className="font-bold">KittyKat Assistant</h2>
          </div>
          <Button
            onClick={() => setShowChatAssistant(false)}
            className="text-xs text-muted-foreground"
            variant="ghost"
            size="sm"
          >
            <PanelRightClose />
            <h3 className="font-bold  ">Close</h3>
          </Button>
        </div>
        <p className="text-muted-foreground font-light mt-2 text-xs">
          I can help you create stunning visuals, manage your brand, and run
          campaigns.
        </p>
      </div>

      <StickToBottom className="relative justify-end flex-1 max-h-full overflow-y-hidden pl-3 pr-2">
        <AgentDebug className="absolute top-4 right-4 z-20" />

        <StickyToBottomContent
          id="chat-panel-scroll-container"
          contentClassName={cn(
            "pb-2 ml-auto mr-0 flex flex-col gap-1 w-full overflow-y-auto"
          )}
          content={
            !chatStarted ? (
              <div className="pt-2">
                <HumanMessage
                  message={{
                    content:
                      "Hi! I'm here to help with your creative work. What would you like to do today?",
                    type: "human",
                    id: "welcome-message",
                  }}
                  isLoading={false}
                />
              </div>
            ) : (
              <div className="pt-2">
                <ChatMessageList
                  firstTokenReceived={firstTokenReceived}
                  setFirstTokenReceived={setFirstTokenReceived}
                  prevMessageLength={prevMessageLength}
                />
              </div>
            )
          }
          footer={
            <div className="sticky bottom-0 flex flex-col w-full bg-transparent rounded-2xl" />
          }
        />
      </StickToBottom>

      <div className="px-3 border-t pt-2">
        <ChatInput setFirstTokenReceived={setFirstTokenReceived} />
      </div>
    </div>
  );
};

export default KittyKatAssistant;
