import { useStreamContext } from "@/providers/Stream";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Message } from "@langchain/langgraph-sdk";
import { ensureToolCallsHaveResponses } from "@/lib/langgraph.utils";

interface ChatSuggestionsProps {
  setInput: (input: string) => void;
  handleSubmit: any;
}

export function ChatSuggestions({
  setInput,
  handleSubmit,
}: ChatSuggestionsProps) {
  const suggestions = [
    "Help me create a marketing campaign for my new product",
    "Let’s start building a campaign—ask me what you need to know first.",
    "I want to craft a campaign—can we start by clarifying my business goals?",
  ];

  const stream = useStreamContext();
  const handleSuggestionClick = (suggestion: string) => {
    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: suggestion,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
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
    <div className="w-full max-w-2xl mx-auto mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Try asking about:
        </h3>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto px-4 py-3 font-normal text-left text-gray-700 hover:bg-gray-50"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
