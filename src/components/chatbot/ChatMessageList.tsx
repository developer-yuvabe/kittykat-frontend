import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import React from "react";
import { HumanMessage } from "../thread/messages/human";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { StreamContextType } from "@/providers/langgraph/Stream";

type ChatMessageListProps = {
  messages: Message[];
  isLoading: boolean;
  firstTokenReceived: boolean;
  hasNoAIOrToolMessages: boolean;
  stream: StreamContextType;
  handleRegenerate: (parentCheckpoint?: Checkpoint | null) => void;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  firstTokenReceived,
  hasNoAIOrToolMessages,
  stream,
  handleRegenerate,
}) => {
  return (
    <>
      {messages
        .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
        .map((message, index) => {
          const key = message.id || `${message.type}-${index}`;

          if (message.type === "human") {
            return (
              <HumanMessage key={key} message={message} isLoading={isLoading} />
            );
          }

          return (
            <AssistantMessage
              key={key}
              message={message}
              isLoading={isLoading}
              handleRegenerate={handleRegenerate}
              agentId={stream.values?.next}
            />
          );
        })}

      {hasNoAIOrToolMessages && !!stream.interrupt && (
        <AssistantMessage
          key="interrupt-msg"
          message={undefined}
          isLoading={isLoading}
          handleRegenerate={handleRegenerate}
        />
      )}

      {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
    </>
  );
};
