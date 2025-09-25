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
import { useUserStore } from "@/store/user.store";
import { updateUser } from "@/services/api/user.service";
import { client } from "./langgraph.client";
import Splash from "@/components/shared/Splash";

export type StateType = {
  messages: Message[];
  next?: string;
  userId: string;
  currentBrandContextId: string | null;
  previousBrandContextId?: string | null;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      next?: string;

      userId: string;
      currentBrandContextId: string | null;
      previousBrandContextId?: string | null;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export type StreamContextType = ReturnType<typeof useTypedStream> & {};

const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  apiUrl,
  assistantId,
  cahedData,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
  cahedData?: StateType | null;
}) => {
  const { user, setUser } = useUserStore();

  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId: user?.thread_id ?? undefined,
    initialValues: cahedData,
    reconnectOnMount: true,
    fetchStateHistory: {
      limit: 1,
    },
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
        if (user?.thread_id && client) {
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
    return <Splash />;
  }

  return (
    <StreamSession
      apiUrl={new URL("/api/langgraph", window.location.href).href}
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
