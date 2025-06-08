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
import Splash from "@/components/shared/Splash";
import { KITTYKAT_AGENT_ID } from "@/lib/constants";
import { env } from "@/config/env";
import { useUserStore } from "@/store/user.store";
import { updateUser } from "@/services/api/user.service";

export type StateType = {
  messages: Message[];
  next?: string;
  userId: string;
  currentBrandContextId: string | null;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      next?: string;

      userId: string;
      currentBrandContextId: string | null;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export type StreamContextType = ReturnType<typeof useTypedStream> & {};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

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
  const { user } = useUserStore();
  if (!user) {
    console.log("User ID: if not found, debug this is IMPORTANT");
  }
  console.log(user?.thread_id);
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: user?.thread_id,
    onThreadId: (id) => {
      updateUser(user!.id, {
        thread_id: id,
      });
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
        const hideToolCallsToSet = hideToolCalls || "false";
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
