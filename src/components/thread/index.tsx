import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { useQueryState, parseAsBoolean } from "nuqs";

import { toast } from "sonner";

import Image from "next/image";
import Logo from "@/assets/kittykat-logo.svg";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import { ScrollToBottom } from "../chatbot/ScrollToBottom";
import { StickyToBottomContent } from "../chatbot/StickyToBottomContent";
import { ChatInput } from "../chatbot/ChatInput";
import { ChatHeader } from "../chatbot/ChatHeader";
import { ChatMessageList } from "../chatbot/ChatMessageList";
import { ChatHistoryPanel } from "../chatbot/ChatHistoryPanel";
import { ChatSuggestions } from "../chatbot/ChatSuggestions";
import { ToolResult } from "./messages/tool-calls";
import ToolResultsPanel from "../chatbot/ToolResultsPanel";
import { SettingsPopover } from "../chatbot/SettingsPopover";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ensureToolCallsHaveResponses } from "@/lib/langgraph.utils";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { StickToBottom } from "use-stick-to-bottom";

export function Thread() {
  const [threadId, setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false)
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
  );
  const [hideAgentComms, setHideAgentComms] = useState(false);
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      }
    );

    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool"
  );

  const filteredMessages = messages.filter(
    (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
  );

  // Separate tool messages from others
  const toolMessages = filteredMessages.filter((m) => m.type === "tool");
  const nonToolMessages = filteredMessages.filter((m) => m.type !== "tool");

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  return (
    <div className="flex w-full  h-[88vh] overflow-hidden rounded-2xl">
      <div className="relative hidden lg:flex">
        <ChatHistoryPanel
          chatHistoryOpen={chatHistoryOpen}
          isLargeScreen={isLargeScreen}
        />
      </div>{" "}
      <motion.div
        className={cn(
          "flex-1 flex flex-col min-w-0 mx-2 overflow-hidden relative -ml-80",
          !chatStarted && "grid-rows-[1fr]"
        )}
        layout={isLargeScreen}
        animate={{
          marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
          width: chatHistoryOpen
            ? isLargeScreen
              ? "calc(100% - 300px)"
              : "100%"
            : "100%",
        }}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: 300, damping: 30 }
            : { duration: 0 }
        }
      >
        {/* Main content flex container - Side by side layout */}
        <div className="flex flex-1 h-full ">
          {/* Tool Results Panel - Left Side */}
          <ToolResultsPanel
            isLargeScreen={isLargeScreen}
            chatHistoryOpen={chatHistoryOpen}
            setChatHistoryOpen={setChatHistoryOpen}
            toolMessages={toolMessages}
            setThreadId={setThreadId}
          />

          {/* Chat Area - Right Side */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 overflow-hidden relative",
              !chatStarted && "grid-rows-[1fr]"
            )}
          >
            {!chatStarted && (
              <div className="absolute top-0 left-0 z-10 flex items-center justify-between w-full gap-3 p-2 pl-4">
                <div></div>
                <div className={`flex justify-end mt-2 mr-3 space-x-3`}>
                  <SettingsPopover />
                </div>
              </div>
            )}

            <StickToBottom className="relative justify-end flex-1 rounded-2xl bg-[#F3F4F6]">
              {chatStarted && (
                <>
                  <div
                    className={`flex justify-start mt-3 z-20 ml-3 space-x-3`}
                  >
                    <SettingsPopover />
                  </div>
                </>
              )}
              <StickyToBottomContent
                className={cn(
                  "absolute inset-0 px-4 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                  !chatStarted && "flex flex-col items-stretch mt-[25vh]",
                  chatStarted && "grid grid-rows-[1fr_auto]"
                )}
                contentClassName="pt-8 pb-2 max-w-3xl ml-auto mr-0 flex flex-col gap-4 w-full"
                content={
                  <ChatMessageList
                    messages={nonToolMessages}
                    isLoading={isLoading}
                    firstTokenReceived={firstTokenReceived}
                    hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                    hideAgentComms={hideAgentComms}
                    stream={stream}
                    handleRegenerate={handleRegenerate}
                  />
                }
                footer={
                  <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-transparent rounded-2xl">
                    {!chatStarted && (
                      <>
                        <div className="flex items-center gap-3">
                          <Image
                            src={Logo}
                            alt="LangGraph Logo"
                            width={100}
                            height={40}
                            className="flex-shrink-0"
                          />
                          <h1 className="text-2xl font-semibold tracking-tight">
                            CMO Agent
                          </h1>
                        </div>
                        {/* <ChatSuggestions
                          setInput={setInput}
                          handleSubmit={handleSubmit}
                        /> */}
                      </>
                    )}
                    <ScrollToBottom className="absolute mb-0 -translate-x-1/3  bottom-full right-1/4 animate-in fade-in-0 zoom-in-95" />

                    <ChatInput
                      input={input}
                      setInput={setInput}
                      handleSubmit={handleSubmit}
                      hideToolCalls={hideToolCalls}
                      setHideToolCalls={setHideToolCalls}
                      isLoading={isLoading}
                      stream={stream}
                    />
                  </div>
                }
              />
            </StickToBottom>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
