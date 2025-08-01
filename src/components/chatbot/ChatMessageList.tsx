import { Checkpoint } from "@langchain/langgraph-sdk";
import React, { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { HumanMessage } from "../thread/messages/human";
import { AssistantMessage } from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { parseAsBoolean, useQueryState } from "nuqs";
import { AssistantMessageLoader } from "../thread/messages/AssistantMessageLoader";

type ChatMessageListProps = {
  firstTokenReceived: boolean;
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>;
  prevMessageLength: React.MutableRefObject<number>;
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  firstTokenReceived,
  setFirstTokenReceived,
  prevMessageLength,
}) => {
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(true)
  );

  const { messages, isLoading, interrupt, values, submit } = useStreamContext();

  const handleRegenerate = useCallback(
    (parentCheckpoint: Checkpoint | null | undefined) => {
      prevMessageLength.current -= 1;
      setFirstTokenReceived(false);
      submit(undefined, {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
      });
    },
    [prevMessageLength, setFirstTokenReceived, submit]
  );

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX));
  }, [messages]);

  const hasNoAIOrToolMessages = useMemo(() => {
    return !messages.some((m) => m.type === "ai" || m.type === "tool");
  }, [messages]);

  const agentIndicator = useMemo(() => {
    if (hideToolCalls) return null;

    return (
      <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg w-max">
        <h3 className="text-gray-900 text-sm">
          Agent Triggered: <span className="font-semibold">{values.next}</span>
        </h3>
      </div>
    );
  }, [hideToolCalls, values.next]);

  return (
    <>
      {filteredMessages.map((message, index) => {
        const key = message.id || `${message.type}-${index}`;

        return message.type === "human" ? (
          <HumanMessage key={key} message={message} isLoading={isLoading} />
        ) : (
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

      {isLoading && !firstTokenReceived && <AssistantMessageLoader />}

      {agentIndicator}
    </>
  );
};
