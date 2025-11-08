import React, { SetStateAction } from "react";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@langchain/langgraph-sdk";
import { ensureToolCallsHaveResponses } from "@/lib/langgraph.utils";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";
import { auth } from "@/config/firebase.config";
import { useModelsStore } from "@/store/models.store";

type ChatSuggestionsProps = {
  setFirstTokenReceived: (value: SetStateAction<boolean>) => void;
};

export function ChatSuggestions({
  setFirstTokenReceived,
}: ChatSuggestionsProps) {
  const { user } = useUserStore();
  const { selectedBrandId, selectedCampaignId, selectedMoodboardId } =
    useBrandStore();
  const { selectedImageGenerationModel } = useModelsStore();
  const suggestions = [
    "Help me get started with branding—what do you need to know from me?",
    "I want to set up my brand—can you guide me through the first steps?",
    "What kind of support can you offer for launching my brand?",
  ];

  const stream = useStreamContext();
  const handleSuggestionClick = async (suggestion: string) => {
    setFirstTokenReceived(false);
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: suggestion,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    stream.submit(
      {
        messages: [...toolMessages, newHumanMessage],
        userId: user!.id,
        currentBrandContextId: selectedBrandId,
        previousBrandContextId: stream.values.previousBrandContextId,
        currentCampaignId: selectedCampaignId,
        currentMoodboardId: selectedMoodboardId,
        currentSelectedImageGenerationModelId:
          selectedImageGenerationModel?.id ?? null,
        userAccessToken: (await auth.currentUser?.getIdToken()) ?? null,
      },

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
  };

  return (
    <div className="w-full  relative mx-auto mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Try asking about:
        </h3>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto cursor-pointer px-4 py-3 font-normal text-left text-gray-700 hover:bg-gray-50 break-words whitespace-normal w-full"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
              <span className="">{suggestion}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
