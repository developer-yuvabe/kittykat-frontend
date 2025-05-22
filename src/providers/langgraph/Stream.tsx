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

import Splash from "@/components/shared/Splash";
import { KITTYKAT_AGENT_ID, KITTYKAT_AGENT_SERVER } from "@/lib/constants";
import { env } from "@/config/env";

export type StateType = { messages: Message[]; ui?: UIMessage[]; sources: any };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      sources?: {
        brandingInformation?: Record<string, any>;
        campaigns?: Record<string, any>;
        [key: string]: any;
      };
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream> & {
  updateCampaign: (updatedCampaign: { id: string; [key: string]: any }) => void;
  getCampaignById: (id: string) => Record<string, any> | undefined;
};

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
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  // Adding updateCampaign function
  const updateCampaign = (updatedCampaign: {
    id: string;
    [key: string]: any;
  }) => {
    const campaigns = streamValue.values.sources.campaigns || {};
    const { id, ...rest } = updatedCampaign;
    streamValue.values.sources.campaigns = {
      ...campaigns,
      [id]: { ...campaigns[id], ...rest },
    };
  };

  // Adding getCampaignById function
  const getCampaignById = (id: string) => {
    const campaigns = streamValue.values.sources.campaigns || {};
    console.log("stream camp id ", id);
    console.log("streamCamp", campaigns);
    return campaigns[id];
  };

  return (
    <StreamContext.Provider
      value={{ ...streamValue, updateCampaign, getCampaignById }}
    >
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
      apiUrl={KITTYKAT_AGENT_SERVER}
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
