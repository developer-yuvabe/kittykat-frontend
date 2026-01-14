import {
  isAgentInboxInterruptSchema,
  parseAnthropicStreamedToolCalls,
} from "@/lib/langgraph.utils";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMemo } from "react";
import { ThreadView } from "../agent-inbox";
import { MarkdownText } from "../markdown-text";
import { getContentString } from "../utils";
import { GenericInterruptView } from "./generic-interrupt";
import { BranchSwitcher, CommandBar } from "./shared";
import { ToolCalls, ToolResult } from "./tool-calls";
import { AssistantMessageLoader } from "./AssistantMessageLoader";

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const content = message?.content ?? [];
  const contentString = useMemo(() => getContentString(content), [content]);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(true)
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1].id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === "ai" || m.type === "tool"
  );
  const meta = message ? thread.getMessagesMetadata(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    "tool_calls" in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === "tool";

  // Get the current active tool call for contextual loading - memoized with stable deps
  const activeToolCall = useMemo(() => {
    if (hasToolCalls && message?.tool_calls?.[0]) {
      return message.tool_calls[0];
    }
    if (hasAnthropicToolCalls && anthropicStreamedToolCalls?.[0]) {
      return anthropicStreamedToolCalls[0];
    }
    return null;
  }, [
    hasToolCalls,
    message?.type === "ai" ? message.tool_calls : undefined,
    hasAnthropicToolCalls,
    anthropicStreamedToolCalls,
  ]);

  // Check if this is an agent communication that should be hidden
  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 mr-auto group max-w-[80%]">
      {isToolResult ? (
        <ToolResult message={message} />
      ) : (
        <div className="flex flex-col gap-2">
          {isLoading &&
            isLastMessage &&
            contentString.length === 0 &&
            !toolCallsHaveContents && (
              <AssistantMessageLoader tool={activeToolCall} />
            )}

          {contentString && (
            <div className="w-full max-w-full bg-muted p-4 rounded-2xl overflow-x-auto">
              <MarkdownText>{contentString}</MarkdownText>
            </div>
          )}

          {!hideToolCalls && (
            <>
              {(hasToolCalls && toolCallsHaveContents && (
                <ToolCalls toolCalls={message.tool_calls} />
              )) ||
                (hasAnthropicToolCalls && (
                  <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                )) ||
                (hasToolCalls && <ToolCalls toolCalls={message.tool_calls} />)}
            </>
          )}

          {isAgentInboxInterruptSchema(threadInterrupt?.value) &&
            (isLastMessage || hasNoAIOrToolMessages) && (
              <ThreadView interrupt={threadInterrupt.value} />
            )}
          {threadInterrupt?.value &&
          !isAgentInboxInterruptSchema(threadInterrupt.value) &&
          isLastMessage ? (
            <GenericInterruptView interrupt={threadInterrupt.value} />
          ) : null}
          <div
            className={cn(
              "flex gap-2 items-center mr-auto transition-opacity",
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            )}
          >
            <BranchSwitcher
              branch={meta?.branch}
              branchOptions={meta?.branchOptions}
              onSelect={(branch) => thread.setBranch(branch)}
              isLoading={isLoading}
            />
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
              handleRegenerate={() => handleRegenerate(parentCheckpoint)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
