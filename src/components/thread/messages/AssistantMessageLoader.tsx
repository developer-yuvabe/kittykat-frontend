import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  genericMessages,
  getLoadingMessagesForTool,
} from "@/lib/langgraph.utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Enhanced loading component with tool-specific messages
export function AssistantMessageLoader({
  tool = null,
}: {
  tool?: { name?: string } | null;
}) {
  const [currentMessage, setCurrentMessage] = useState<string>(
    "Processing your request..."
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // New timeout reference

  // Stable tool name reference to prevent unnecessary re-renders
  const toolName = tool?.name || null;

  // Memoize the loading config to prevent recalculation
  const loadingConfig = useMemo(() => {
    return toolName ? getLoadingMessagesForTool(toolName) : null;
  }, [toolName]);

  // Clear interval and timeout on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Stable message rotation function for generic messages
  const rotateMessage = useCallback((messages: string[]) => {
    setMessageIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % messages.length;
      setCurrentMessage(messages[nextIndex]);
      return nextIndex;
    });
  }, []);

  // Dynamic message rotator for tool-specific messages with duration
  const startDynamicToolMessageRotation = useCallback(
    (messages: { message: string; duration?: number }[], startIndex = 0) => {
      const rotate = (index: number) => {
        const { message, duration = 2.2 } = messages[index];
        setCurrentMessage(message);
        setMessageIndex(index);
        timeoutRef.current = setTimeout(() => {
          const nextIndex = (index + 1) % messages.length;
          rotate(nextIndex);
        }, duration * 1000);
      };
      rotate(startIndex);
    },
    []
  );

  useEffect(() => {
    // Clear existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If we have a tool-specific configuration
    if (loadingConfig) {
      if (Array.isArray(loadingConfig)) {
        // Start dynamic timed rotation
        startDynamicToolMessageRotation(loadingConfig);
        return;
      } else {
        // Single tool-specific message
        setCurrentMessage(loadingConfig.message);
        setMessageIndex(0);
        return;
      }
    }

    // If we have a tool but no specific config, show generic tool message
    if (toolName) {
      setCurrentMessage(`Processing ${toolName}...`);
      setMessageIndex(0);
      return;
    }

    // Fallback to generic messages with slower rotation

    setCurrentMessage(genericMessages[0]);
    setMessageIndex(0);

    intervalRef.current = setInterval(() => {
      rotateMessage(genericMessages);
    }, 4000); // 4 seconds for generic messages

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toolName, loadingConfig, rotateMessage, startDynamicToolMessageRotation]);

  // Get current animation duration based on the message type
  const animationDuration = useMemo(() => {
    if (loadingConfig) {
      if (Array.isArray(loadingConfig)) {
        return loadingConfig[messageIndex]?.duration || 2.2;
      } else {
        return loadingConfig.duration || 2.2;
      }
    }
    return 3.2;
  }, [loadingConfig, messageIndex]);

  return (
    <div className="flex items-start gap-2 mr-auto">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-2xl">
        <span className="text-sm text-foreground/80">
          <TextShimmer
            className="font-mono text-sm [--base-gradient-color:var(--color-purple-800)]"
            duration={animationDuration}
            key={currentMessage}
          >
            {currentMessage}
          </TextShimmer>
        </span>
      </div>
    </div>
  );
}
