import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { ToolCalls, ToolResult } from "./tool-calls";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";
import { GenericInterruptView } from "./generic-interrupt";
import {
  clientComponents,
  getLoadingMessageForTool,
  isAgentInboxInterruptSchema,
} from "@/lib/langgraph.utils";
import { TextShimmer } from "@/components/ui/text-shimmer";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent }}
          components={clientComponents}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[]
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}
export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
  hideAgentComms,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
  hideAgentComms?: boolean;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
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

  // Check if this is an agent communication that should be hidden

  if (isToolResult && hideToolCalls) {
    return null;
  }

  if (
    message?.type === "ai" &&
    message.content.length === 0 &&
    isLastMessage &&
    hasToolCalls
  ) {
    {
      message?.tool_calls && (
        <AssistantMessageLoading tool={message.tool_calls[0]} />
      );
    }
  }

  return (
    <div className="flex items-start gap-2 mr-auto group">
      {isToolResult ? (
        <ToolResult message={message} />
      ) : (
        <div className="flex flex-col gap-2">
          {/* Add agent name indicator if this is from an agent other than primary/master */}

          {isLoading &&
            isLastMessage &&
            contentString.length === 0 &&
            !toolCallsHaveContents && <AssistantMessageLoading />}

          {contentString.length > 0 && (
            <div className="py-1 sm:w-96 max-w-xl bg-white p-4 rounded-2xl">
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

          {message && <CustomComponent message={message} thread={thread} />}
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
export function AssistantMessageLoading({
  tool = null,
}: {
  tool?: { name?: string } | null;
}) {
  console.log("tool", tool);
  // Get loading message configuration based on tool name
  const loadingConfig = tool?.name ? getLoadingMessageForTool(tool.name) : null;
  const loadingMessage = loadingConfig?.message;

  // Default animation duration (can be overridden in config)
  const animationDuration = loadingConfig?.duration || 1.5;

  return (
    <div className="flex items-start gap-2 mr-auto">
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl">
        {!loadingMessage && (
          <div className="flex items-center h-8 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]"></div>
          </div>
        )}
        {loadingMessage && (
          <span className="text-sm text-foreground/80 ml-2">
            <TextShimmer
              className="font-mono text-sm [--base-gradient-color:var(--color-purple-800)]"
              duration={1}
            >
              {loadingMessage}
            </TextShimmer>
          </span>
        )}
      </div>
    </div>
  );
}
