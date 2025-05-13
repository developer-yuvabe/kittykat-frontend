"use client";
import { validate } from "uuid";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "./client";
import { DEFAULT_API_URL, DEFAULT_ASSISTANT_ID } from "@/lib/constants";
import { getApiKey } from "../lib/api-key";

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
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    try {
      // Use fallback values if API URL or assistant ID are not in query params
      const effectiveApiUrl = apiUrl || DEFAULT_API_URL;
      const effectiveAssistantId = assistantId || DEFAULT_ASSISTANT_ID;
      if (!effectiveApiUrl || !effectiveAssistantId) return [];

      const client = createClient(effectiveApiUrl, getApiKey() ?? undefined);
      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(effectiveAssistantId),
        },
        limit: 100,
      });
      return threads;
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      return [];
    }
  }, [apiUrl, assistantId]);

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
        const effectiveApiUrl = apiUrl || DEFAULT_API_URL;
        if (!effectiveApiUrl) return false;

        const client = createClient(effectiveApiUrl, getApiKey() ?? undefined);

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
    [apiUrl, setThreads]
  );

  // Fetch threads when component mounts or when apiUrl/assistantId change
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
  }, [apiUrl, assistantId, getThreads]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    updateThreads,
    updateThreadName,
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
