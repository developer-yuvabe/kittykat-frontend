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
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { useThreads } from "./Thread";

import Splash from "@/components/shared/Splash";
import { KITTYKAT_AGENT_ID } from "@/lib/constants";
import { env } from "@/config/env";

export type StateType = { messages: Message[]; next?: string };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      next?: string;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export type StreamContextType = ReturnType<typeof useTypedStream> & {};

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
    onThreadId: (id) => {
      setThreadId(id);
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  return (
    <StreamContext.Provider value={{ ...streamValue }}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const envApiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;
  const [isInitialized, setIsInitialized] = useState(false);
  const [hideToolCalls, setHideToolCalls] = useQueryState("hideToolCalls");

  useEffect(() => {
    const initializeParams = async () => {
      try {
        const hideToolCallsToSet = hideToolCalls || "true";
        const promises = [];

        if (!hideToolCalls || hideToolCalls !== hideToolCallsToSet) {
          promises.push(setHideToolCalls(hideToolCallsToSet));
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize query parameters:", error);
        setIsInitialized(true);
      }
    };

    initializeParams();
  }, []);

  if (!isInitialized) {
    return <Splash />;
  }

  return (
    <StreamSession
      apiKey={envApiKey || null}
      apiUrl={env.NEXT_PUBLIC_KITTYKAT_AGENT_SERVER}
      assistantId={KITTYKAT_AGENT_ID}
    >
      {children}
    </StreamSession>
  );
};

export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
