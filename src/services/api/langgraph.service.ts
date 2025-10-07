import { scrollToBottom } from "@/lib/scroll.utils";
import { client } from "@/providers/langgraph/langgraph.client";
import { StateType, StreamContextType } from "@/providers/langgraph/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";

type SubmitOptions = {
  stream: StreamContextType;
  text: string;
  userId: string;
  currentBrandContextId: string | null;
};

export function submitOptimisticMessage({
  stream,
  text,
  userId,
  currentBrandContextId,
}: SubmitOptions) {
  const newMessage: Message = {
    id: uuidv4(),
    type: "human",
    content: [
      {
        type: "text",
        text,
      },
    ],
  };

  stream.submit(
    {
      messages: [newMessage],
      userId,
      currentBrandContextId,
      previousBrandContextId: stream.values.previousBrandContextId,
    },
    {
      streamMode: ["values"],
      optimisticValues: (prev: any) => ({
        ...prev,
        messages: [...(prev.messages ?? []), newMessage],
      }),
    }
  );
  scrollToBottom(100);
}

export const fetchThreadState = async (threadId: string) => {
  const threadInformation = await client!.threads.get<StateType>(threadId);
  return threadInformation.values;
};

export const updateCurrentContextBrandId = async (
  threadId: string,
  currentBrandContextId: string | null,
  previousBrandContextId: string | null
) => {
  await client!.threads.updateState(threadId, {
    values: {
      currentBrandContextId,
      previousBrandContextId,
    },
  });
};
