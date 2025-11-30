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
import Splash from "@/components/shared/Splash";
import { fetchThreadState } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { client } from "./langgraph.client";
import { toast } from "sonner";
import { logError } from "@/services/actions/log-error";
import { env } from "@/config/env";

export type StateType = {
  messages: Message[];
  next?: string;
  userId: string;
  chatOnlyMode: boolean;
  currentBrandContextId: string | null;
  previousBrandContextId?: string | null;

  currentCampaignId: string | null;
  currentMoodboardId: string | null;

  currentSelectedImageGenerationModelId: string | null;
  currentSelectedVideoGenerationModelId: string | null;
  userAccessToken: string | null;

  timestamp: number;
  activeTeamId: string | null;
};

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      next?: string;

      userId: string;
      chatOnlyMode: boolean;
      currentBrandContextId: string | null;
      previousBrandContextId?: string | null;

      currentCampaignId: string | null;
      currentMoodboardId: string | null;

      currentSelectedImageGenerationModelId: string | null;
      currentSelectedVideoGenerationModelId: string | null;
      userAccessToken: string | null;
      activeTeamId: string | null;
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
    onError: (error) => {
      if (process.env.NODE_ENV === "production") {
        logError(
          user?.id || "-",
          user?.email || "-",
          env.NEXT_PUBLIC_ENVIRONMENT,
          `Thread Id: ${user?.thread_id}\n${String(error)}`
        );
      }
      toast.error(
        "An error occurred while connecting to the agent. Please try again."
      );
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
  const { setSelectedBrandId } = useBrandStore();
  const { user, setUser } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [cahedData, setCachedData] = useState<StateType | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      try {
        if (user?.thread_id && client) {
          try {
            const threadData = await fetchThreadState(user.thread_id);
            setCachedData(threadData);
            /* This initialization ensures that the brand context is in sync with the thread state */
            setSelectedBrandId(threadData.currentBrandContextId);
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
