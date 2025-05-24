import Logo from "@/assets/kittykat-logo.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  DO_NOT_RENDER_ID_PREFIX,
  RENDER_FILE_ID_PREFIX,
} from "@/lib/constants";
import {
  addFileWrappers,
  ensureToolCallsHaveResponses,
  removeFileWrappers,
} from "@/lib/langgraph.utils";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useThreads } from "@/providers/langgraph/Thread";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { useUserStore } from "@/store/user.store";
import { MessageContentFiles } from "@/types/langgraph.types";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import Image from "next/image";
import { parseAsBoolean, useQueryState } from "nuqs";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StickToBottom } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";
import { ChatInput } from "../chatbot/ChatInput";
import { ChatMessageList } from "../chatbot/ChatMessageList";
import { ScrollToBottom } from "../chatbot/ScrollToBottom";
import { SettingsPopover } from "../chatbot/SettingsPopover";
import { StickyToBottomContent } from "../chatbot/StickyToBottomContent";
import ThreadDetailsPanel from "../chatbot/ThreadDetailsPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { ChatSkeleton } from "./messages/message-skeleton";

export function Thread() {
  const lastInteractedBrandId = useUserStore((state) =>
    state.getLastInteractedBrandId()
  );

  const [threadId, setThreadId] = useQueryState("threadId");
  const { threads, threadsLoading, setThreadsLoading } = useThreads();
  const [initializingThread, setInitializingThread] = useState(true);

  const handleThreadChange = (id: string | null): void => {
    setThreadsLoading(true);

    (async () => {
      if (id) {
        setThreadId(id);
      }

      // Mock wait for 2 sec
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setThreadsLoading(false);
    })();
  };

  useEffect(() => {
    if (threadsLoading) return; // Wait for threads to load

    // Check if the last interacted brand ID is valid
    if (lastInteractedBrandId && !threadId) {
      const isValidThread = threads.some(
        (thread) => thread.thread_id === lastInteractedBrandId
      );

      if (isValidThread) {
        setThreadId(lastInteractedBrandId);
      }
    }

    // If there's a threadId but it's not in the threads list, reset it
    if (threadId) {
      const isValidThread = threads.some(
        (thread) => thread.thread_id === threadId
      );

      if (!isValidThread) {
        setThreadId(null);
      }
    }

    // Mark initialization as complete
    setInitializingThread(false);
  }, [threadsLoading]);

  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
  );
  const [input, setInput] = useState("");
  const [fileList, setFileList] = useState<MessageContentFiles[]>([]);
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
    } finally {
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
    const pinnedItem = usePinnedContextStore.getState().pinnedItem;
    const pinnedContextMessage: Message | null = pinnedItem
      ? {
          id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
          type: "system",
          content: [
            {
              type: "text",
              text: `Focus only on the following context with the associated data:\nTitle: ${
                pinnedItem.title
              }\nContext: ${JSON.stringify(pinnedItem.context)}`,
            },
          ],
        }
      : null;

    console.log("pinnedContextMessage", pinnedContextMessage);

    resetFiles();

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        {
          type: "text",
          text: input,
        },
      ],
    };

    const newFileList: Message[] = fileList.map((item) => ({
      id: item.id,
      type: "human",
      content: [
        {
          type: "text",
          text: item.file.text,
        },
      ],
    }));
    resetFiles();
    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      {
        messages: [
          ...toolMessages,
          ...newFileList,
          ...(pinnedContextMessage ? [pinnedContextMessage] : []),
          newHumanMessage,
        ],
      },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            ...newFileList,

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

  const nonToolMessages = filteredMessages.filter((m) => m.type !== "tool");

  const setLastInteractedBrandId = useUserStore(
    (state) => state.setLastInteractedBrandId
  );

  const handleAddFile = (url: string) => {
    addFileWrappers(url, setFileList);
  };

  const handleRemoveFile = (id: string) => {
    const trimmedId = id
      .replace(RENDER_FILE_ID_PREFIX, "")
      .replace(DO_NOT_RENDER_ID_PREFIX, "");
    removeFileWrappers(trimmedId, setFileList);
  };

  const resetFiles = () => {
    setFileList([]);
  };
  const clearPins = usePinnedContextStore((state) => state.clearPinnedItem);

  useEffect(() => {
    if (threadId) {
      setLastInteractedBrandId(threadId);

      clearPins();
    }
  }, [threadId]);

  return (
    <div className="flex w-full h-[calc(100vh-8rem)] overflow-hidden">
      <div className="w-full px-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex flex-1 h-full"
        >
          {/* Tool Results Panel - Left Side */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <ThreadDetailsPanel
              isLargeScreen={isLargeScreen}
              setThreadId={handleThreadChange}
              threadId={threadId}
            />
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
              {!chatStarted && (
                <div className="absolute top-0 left-0 z-10 flex items-center justify-between w-full gap-3 p-2 pl-4">
                  <div className="flex justify-end mt-2 mr-3 space-x-3">
                    <SettingsPopover />
                  </div>
                </div>
              )}

              <StickToBottom className="relative justify-end flex-1 rounded-2xl bg-[#F3F4F6]">
                {chatStarted && (
                  <div className="flex justify-start mt-3 z-20 ml-3 space-x-3">
                    <SettingsPopover />
                  </div>
                )}

                {/* Only show skeleton during loading, nothing else */}
                {threadsLoading || initializingThread ? (
                  <div className="absolute inset-0 px-4 overflow-y-scroll scrollbar">
                    <div className="pt-8 pb-2 ml-auto mr-0 flex flex-col gap-1 w-full">
                      <ChatSkeleton />
                    </div>
                  </div>
                ) : (
                  <StickyToBottomContent
                    className={cn(
                      "absolute inset-0 px-4 overflow-y-scroll scrollbar",
                      !chatStarted && "flex flex-col items-stretch mt-[25vh]",
                      chatStarted && "grid grid-rows-[1fr_auto]"
                    )}
                    contentClassName="pt-8 pb-2 ml-auto mr-0 flex flex-col gap-1 w-full"
                    content={
                      <ChatMessageList
                        messages={nonToolMessages}
                        isLoading={isLoading}
                        firstTokenReceived={firstTokenReceived}
                        hasNoAIOrToolMessages={hasNoAIOrToolMessages}
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
                                alt="KittyKat Logo"
                                width={100}
                                height={40}
                                className="flex-shrink-0"
                              />
                            </div>

                            <ScrollToBottom className="absolute mb-0 -translate-x-1/3 bottom-full right-1/4 animate-in fade-in-0 zoom-in-95" />
                          </>
                        )}

                        {/* Always show the chat input unless we're in loading states */}
                        {!(threadsLoading || initializingThread) && (
                          <ChatInput
                            input={input}
                            setInput={setInput}
                            handleSubmit={handleSubmit}
                            hideToolCalls={hideToolCalls}
                            setHideToolCalls={setHideToolCalls}
                            isLoading={isLoading}
                            stream={stream}
                            handleAddFile={handleAddFile}
                            fileList={fileList}
                            handleRemoveFile={handleRemoveFile}
                            threadId={threadId}
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
