import { Checkpoint } from "@langchain/langgraph-sdk";
import React, { Dispatch, SetStateAction, useMemo } from "react";
import { HumanMessage } from "../thread/messages/human";
import { AssistantMessage } from "../thread/messages/ai";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/constants";
import { useStreamContext } from "@/providers/langgraph/Stream";
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
  const { messages, isLoading, interrupt, submit } = useStreamContext();

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX));
  }, [messages]);

  const hasNoAIOrToolMessages = useMemo(() => {
    return !messages.some((m) => m.type === "ai" || m.type === "tool");
  }, [messages]);

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
    </>
  );
};
