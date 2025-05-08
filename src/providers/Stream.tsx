"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";

import { useThreads } from "./Thread";

import { DEFAULT_API_URL, DEFAULT_ASSISTANT_ID } from "@/lib/constants";
import Splash from "@/components/shared/Splash";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads, setThreads } = useThreads();
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: (id) => {
      setThreadId(id);
      // Refetch threads list when thread ID changes.
      // Wait for some seconds before fetching so we're able to get the new thread that was created.
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID;
  const envApiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;

  // Use URL params with env var fallbacks
  const [apiUrl, setApiUrl] = useQueryState("apiUrl");
  const [assistantId, setAssistantId] = useQueryState("assistantId");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hideToolCalls, setHideToolCalls] = useQueryState("hideToolCalls");

  // Use useEffect to set default values only once on mount
  useEffect(() => {
    const initializeParams = async () => {
      try {
        // Determine values to use, with priority chain:
        // 1. Existing query param value
        // 2. Environment variable
        // 3. Default hardcoded value
        const urlToSet = apiUrl || envApiUrl || DEFAULT_API_URL;
        const idToSet = assistantId || envAssistantId || DEFAULT_ASSISTANT_ID;
        const hideToolCallsToSet = hideToolCalls || "true";

        // Only update if needed to avoid unnecessary re-renders
        const promises = [];
        if (!apiUrl || apiUrl !== urlToSet) {
          promises.push(setApiUrl(urlToSet));
        }
        if (!assistantId || assistantId !== idToSet) {
          promises.push(setAssistantId(idToSet));
        }
        if (!hideToolCalls || hideToolCalls !== hideToolCallsToSet) {
          promises.push(setHideToolCalls(hideToolCallsToSet));
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize query parameters:", error);
        // Set initialized anyway to prevent blocking the UI
        setIsInitialized(true);
      }
    };

    initializeParams();
  }, []);

  // Show loading state until we've initialized
  if (!isInitialized) {
    return <Splash />;
  }

  const finalApiUrl = apiUrl || envApiUrl || DEFAULT_API_URL;
  const finalAssistantId =
    assistantId || envAssistantId || DEFAULT_ASSISTANT_ID;

  return (
    <StreamSession
      apiKey={envApiKey || null}
      apiUrl={finalApiUrl}
      assistantId={finalAssistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
