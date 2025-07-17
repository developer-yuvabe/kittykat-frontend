"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getChatLayoutConfig } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBrandUpdates } from "@/hooks/sse/useBrandUpdates";
import { useBrandStore } from "@/store/brand.store";
import MobileChatPanel from "../chatbot/MobileChatPanel";
import DesktopChatPanel from "../chatbot/DesktopChatPanel";

export function Thread() {
  const { selectedBrandId, setSelectedBrandId } = useBrandStore();
  useBrandUpdates(selectedBrandId);

  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  // Responsive breakpoints
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        return;
      }
      lastError.current = message;
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first token received
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (stream.values.currentBrandContextId) {
      setSelectedBrandId(stream.values.currentBrandContextId);
    }
  }, [stream.values.currentBrandContextId]);

  const chatStarted = useMemo(() => !!messages.length, [messages.length]);

  return (
    <>
      {isLargeScreen ? (
        <DesktopChatPanel
          layoutConfig={getChatLayoutConfig(isLargeScreen)}
          isLargeScreen={isLargeScreen}
          chatStarted={chatStarted}
          firstTokenReceived={firstTokenReceived}
          setFirstTokenReceived={setFirstTokenReceived}
          prevMessageLength={prevMessageLength}
        />
      ) : (
        <MobileChatPanel
          chatStarted={chatStarted}
          firstTokenReceived={firstTokenReceived}
          prevMessageLength={prevMessageLength}
          setFirstTokenReceived={setFirstTokenReceived}
        />
      )}
    </>
  );
}
