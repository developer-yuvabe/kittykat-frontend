import axiosInstance from "@/config/axios/api-client.config";
import { scrollToBottom } from "@/lib/scroll.utils";
import { handleApiRequest } from "@/lib/utils";
import { client } from "@/providers/langgraph/langgraph.client";
import { StateType, StreamContextType } from "@/providers/langgraph/Stream";
import { NextSuggestions } from "@/types/langgraph.types";
import { Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";

type SubmitOptions = {
  stream: StreamContextType;
  text: string;
  userId: string;
  chatOnlyMode: boolean;
  currentBrandContextId: string | null;
  currentCampaignId: string | null;
  currentMoodboardId: string | null;
  currentSelectedImageGenerationModelId: string | null;
  currentSelectedVideoGenerationModelId: string | null;
  userAccessToken: string | null;
  activeTeamId: string;
};

export function submitOptimisticMessage({
  stream,
  text,
  userId,
  chatOnlyMode,
  currentBrandContextId,
  currentCampaignId,
  currentMoodboardId,
  currentSelectedImageGenerationModelId,
  currentSelectedVideoGenerationModelId,
  userAccessToken,
  activeTeamId,
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
      chatOnlyMode,
      currentBrandContextId,
      previousBrandContextId: stream.values.previousBrandContextId,
      currentCampaignId: currentCampaignId,
      currentMoodboardId: currentMoodboardId,
      currentSelectedImageGenerationModelId,
      currentSelectedVideoGenerationModelId,
      userAccessToken,
      activeTeamId,
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

//update active team ID
export const updateActiveTeamIdinThread = async (
  threadId: string,
  activeTeamId: string | null
) => {
  await client!.threads.updateState(threadId, {
    values: {
      activeTeamId,
    },
  });
};

export const fetchSuggestions = async (
  threadId: string,
  messages: Message[],
  state: Record<string, any>
) => {
  try {
    const suggestions = await handleApiRequest<NextSuggestions[]>(
      axiosInstance.post(`/threads/${threadId}/suggestions`, {
        messages,
        state,
      })
    );

    return suggestions;
  } catch (error) {
    console.error(`Failed to fetch suggestions`, error);
  }
};
