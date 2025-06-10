import { Checkpoint } from "@langchain/langgraph-sdk";
import React, { Dispatch, RefObject, SetStateAction } from "react";
import { HumanMessage } from "../thread/messages/human";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { parseAsBoolean, useQueryState } from "nuqs";

type ChatMessageListProps = {
  firstTokenReceived: boolean;
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>;
  prevMessageLength: RefObject<number>;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  firstTokenReceived,
  setFirstTokenReceived,
  prevMessageLength,
}) => {
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
  );

  const { messages, isLoading, interrupt, values, submit } = useStreamContext();

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined
  ) => {
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
    });
  };

  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool"
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

      {hasNoAIOrToolMessages && !!interrupt && (
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
            <span className="font-semibold">{values.next}</span>
          </h3>
        </div>
      )}
    </>
  );
};
