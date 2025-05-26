import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import React from "react";
import { HumanMessage } from "../thread/messages/human";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { StreamContextType } from "@/providers/langgraph/Stream";
import { parseAsBoolean, useQueryState } from "nuqs";

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
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
  );

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

      {/* Add agent name indicator which is triggered */}
      {!hideToolCalls && (
        <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg w-max">
          <h3 className="text-gray-900 text-sm">
            Agent Triggered:{" "}
            <span className="font-semibold">{stream.values.next}</span>
          </h3>
        </div>
      )}
    </>
  );
};
