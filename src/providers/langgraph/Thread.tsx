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
  updateThreads: (
    updateFn?: (currentThreads: Thread[]) => Thread[]
  ) => Promise<Thread[]>;
  updateThreadName: (threadId: string, name: string) => Promise<boolean>;
  deleteThread: (threadId: string) => Promise<boolean>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    try {
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

  // Function to update threads without necessarily setting loading state
  const updateThreads = useCallback(
    async (updateFn?: (currentThreads: Thread[]) => Thread[]) => {
      try {
        const fetchedThreads = await getThreads();
        const updatedThreads = updateFn
          ? updateFn(fetchedThreads)
          : fetchedThreads;
        setThreads(updatedThreads);
        return updatedThreads;
      } catch (error) {
        console.error("Failed to update threads:", error);
        return threads;
      }
    },
    [getThreads, threads]
  );

  // Helper function to update or add a name field in the metadata of a thread
  const updateThreadName = useCallback(
    async (threadId: string, name: string): Promise<boolean> => {
      try {
        // Update the thread name in the remote API
        await client.threads.update(threadId, {
          metadata: { name },
        });

        // Update only the metadata name in the local state
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.thread_id === threadId
              ? {
                  ...thread,
                  metadata: {
                    ...thread.metadata,
                    name,
                  },
                }
              : thread
          )
        );

        return true;
      } catch (error) {
        console.error(
          `Failed to update thread name for thread ${threadId}:`,
          error
        );
        return false;
      }
    },
    [setThreads]
  );

  // Delete a thread by ID
  const deleteThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      try {
        // Delete the thread through the API
        await client.threads.delete(threadId);

        // Remove the thread from local state
        setThreads((prevThreads) =>
          prevThreads.filter((thread) => thread.thread_id !== threadId)
        );

        return true;
      } catch (error) {
        console.error(`Failed to delete thread ${threadId}:`, error);
        return false;
      }
    },
    [setThreads]
  );

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
    updateThreads,
    updateThreadName,
    deleteThread,
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
