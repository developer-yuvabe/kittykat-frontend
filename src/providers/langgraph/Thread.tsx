"use client";

import { Thread } from "@langchain/langgraph-sdk";
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { client } from "./langgraph.client";
import { getThreadSearchMetadata } from "@/lib/langgraph.utils";
import { KITTYKAT_AGENT_ID } from "@/lib/constants";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    try {
      if (!client) {
        return [];
      }
      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(KITTYKAT_AGENT_ID),
        },
        limit: 100,
      });
      return threads;
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      return [];
    }
  }, []);

  // Fetch threads when component mounts
  useEffect(() => {
    async function loadThreads() {
      setThreadsLoading(true);
      try {
        const fetchedThreads = await getThreads();
        setThreads(fetchedThreads);
      } catch (error) {
        console.error("Error loading threads:", error);
      } finally {
        setThreadsLoading(false);
      }
    }

    // Add a small delay to ensure query params have been processed
    const timer = setTimeout(() => {
      loadThreads();
    }, 100);

    return () => clearTimeout(timer);
  }, [getThreads]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
