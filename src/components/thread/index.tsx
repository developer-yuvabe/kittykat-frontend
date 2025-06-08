import Logo from "@/assets/kittykat-logo.svg";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  DO_NOT_RENDER_ID_PREFIX,
  RENDER_FILE_ID_PREFIX,
} from "@/lib/constants";
import {
  addFileWrappers,
  ensureToolCallsHaveResponses,
  getPinnedItemContextMessage,
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
import { StickToBottom } from "use-stick-to-bottom";
import { v4 as uuidv4 } from "uuid";
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
import { useFileUpload } from "@/hooks/useFileUploadToAgent";
import { useBrandStore } from "@/store/brand.store";

export function Thread() {
  const { pinnedItem } = usePinnedContextStore();
  const { user } = useUserStore();
  const { selectedBrandId, setSelectedBrandId } = useBrandStore();
  useBrandUpdates(selectedBrandId);
  const { threadsLoading } = useThreads();
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

  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    handlePaste,
    isUploading,
  } = useFileUpload({ brandId: user!.thread_id! });

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
      console.log(message);
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

  useEffect(() => {
    if (stream.values.currentBrandContextId) {
      setSelectedBrandId(stream.values.currentBrandContextId);
    }
  }, [stream.values.currentBrandContextId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);
    const pinnedContextMessage: string | null = pinnedItem
      ? getPinnedItemContextMessage(pinnedItem)
      : null;

    resetFiles();

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        {
          type: "text",
          text: pinnedContextMessage
            ? `${pinnedContextMessage}${input}`
            : input,
        },
        ...contentBlocks,
      ] as Message["content"],
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

    console.log(newHumanMessage, "new human msg");

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      {
        messages: [...toolMessages, ...newFileList, newHumanMessage],
        userId: user!.id,
        currentBrandContextId: selectedBrandId,
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
    setContentBlocks([]);
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

  const chatStarted = !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool"
  );

  const filteredMessages = messages.filter(
    (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
  );

  const nonToolMessages = filteredMessages.filter((m) => m.type !== "tool");

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

  useEffect(() => {
    console.log(input);
    console.log(contentBlocks);
  }, [input]);

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
                {/* Only show skeleton during loading, nothing else */}
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
                        messages={nonToolMessages}
                        isLoading={isLoading}
                        firstTokenReceived={firstTokenReceived}
                        hasNoAIOrToolMessages={hasNoAIOrToolMessages}
                        stream={stream}
                        handleRegenerate={handleRegenerate}
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

                        {/* Always show the chat input unless we're in loading states */}
                        {!threadsLoading && (
                          <div ref={dropRef} className="w-full">
                            <ChatInput
                              input={input}
                              setInput={setInput}
                              handleSubmit={handleSubmit}
                              hideToolCalls={hideToolCalls}
                              setHideToolCalls={setHideToolCalls}
                              isLoading={isLoading}
                              stream={stream}
                              handleAddFiles={handleFileUpload}
                              handleRemoveImageFile={removeBlock}
                              handlePaste={handlePaste}
                              threadId={user!.thread_id!}
                              files={contentBlocks}
                              isFileUploading={isUploading}
                              fileList={fileList}
                              handleAddFile={handleAddFile}
                              handleRemoveFile={handleRemoveFile}
                            />
                          </div>
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
