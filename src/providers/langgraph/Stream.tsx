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
import { KITTYKAT_AGENT_ID } from "@/lib/constants";
import { env } from "@/config/env";
import { useUserStore } from "@/store/user.store";
import { updateUser } from "@/services/api/user.service";
import { Loader2 } from "lucide-react";
import { client } from "./langgraph.client";
import { AppConfig } from "@/config/app.config";

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
  cahedData,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
  cahedData?: StateType | null;
}) => {
  const { user, setUser } = useUserStore();

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: user?.thread_id ?? undefined,
    initialValues: cahedData,
    reconnectOnMount: true,
    onThreadId: (id) => {
      updateUser(user!.id, {
        thread_id: id,
      });

      setUser({
        ...user!,
        thread_id: id,
      });
    },
  });

  return (
    <StreamContext.Provider
      value={{
        ...streamValue,
      }}
    >
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, setUser } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [cahedData, setCachedData] = useState<StateType | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      try {
        if (user?.thread_id) {
          try {
            const threadData = await client.threads.get<StateType>(
              user.thread_id
            );
            setCachedData(threadData.values);
          } catch (error: any) {
            if (error?.status === 404 || error?.response?.status === 404) {
              updateUser(user!.id, {
                thread_id: null,
              });
              setUser({
                ...user!,
                thread_id: null,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize query parameters:", error);
      } finally {
        setTimeout(() => setIsInitialized(true), 10);
      }
    };

    initializeParams();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center w-full h-[85vh]">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return (
    <StreamSession
      apiKey={env.NEXT_PUBLIC_LANGSMITH_API_KEY}
      apiUrl={AppConfig.KITTYKAT_AGENT_SERVER}
      assistantId={KITTYKAT_AGENT_ID}
      cahedData={cahedData}
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
