import React from "react";
import { cn } from "@/lib/utils";
import { StickToBottom } from "use-stick-to-bottom";
import { StickyToBottomContent } from "./StickyToBottomContent";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatInput } from "./ChatInput";

type ChatComponentProps = {
  isMobile?: boolean;
  chatStarted: boolean;
  firstTokenReceived: boolean;
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>;
  prevMessageLength: React.MutableRefObject<number>;
};

export const ChatComponent: React.FC<ChatComponentProps> = ({
  isMobile = false,
  chatStarted,
  firstTokenReceived,
  setFirstTokenReceived,
  prevMessageLength,
}) => (
  <div className="flex flex-col h-full">
    <div
      className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative",
        !chatStarted && "justify-center"
      )}
    >
      <StickToBottom
        className={cn(
          "relative justify-end flex-1 bg-[#F3F4F6]",
          isMobile ? "rounded-t-2xl" : "rounded-2xl"
        )}
      >
        <StickyToBottomContent
          id="chat-panel-scroll-container"
          className={cn(
            "absolute inset-0 px-3 overflow-y-scroll scrollbar",
            !chatStarted &&
              "flex flex-col items-stretch justify-center min-h-full",
            chatStarted && "grid grid-rows-[1fr_auto]"
          )}
          contentClassName="pt-6 pb-2 flex flex-col gap-1 w-full"
          content={
            <ChatMessageList
              firstTokenReceived={firstTokenReceived}
              setFirstTokenReceived={setFirstTokenReceived}
              prevMessageLength={prevMessageLength}
            />
          }
          footer={
            <div className="sticky bottom-0 flex flex-col w-full bg-transparent">
              {!chatStarted && (
                <>
                  <div className="flex justify-center mb-4">
                    <ChatSuggestions
                      setFirstTokenReceived={setFirstTokenReceived}
                    />
                  </div>
                </>
              )}

              {
                <div className="bg-[#F3F4F6] pb-2">
                  <ChatInput setFirstTokenReceived={setFirstTokenReceived} />
                </div>
              }
            </div>
          }
        />
      </StickToBottom>
    </div>
  </div>
);
