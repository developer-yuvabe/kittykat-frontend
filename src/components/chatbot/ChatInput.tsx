import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Send } from "lucide-react";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  hideToolCalls?: boolean;
  setHideToolCalls: (value: boolean) => void;
  isLoading: boolean;
  stream: {
    isLoading: boolean;
    stop: () => void;
  };
};

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSubmit,
  hideToolCalls,
  setHideToolCalls,
  isLoading,
  stream,
}) => {
  return (
    <div className="relative z-10 w-full max-w-lg  mb-1 ml-auto mr-0 border shadow-xs bg-muted rounded-2xl">
      <form
        onSubmit={handleSubmit}
        className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl ml-auto mr-0"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.metaKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              const el = e.target as HTMLElement | undefined;
              const form = el?.closest("form");
              form?.requestSubmit();
            }
          }}
          placeholder="Message"
          className="p-6  border-none bg-transparent  field-sizing-content placeholder:text-gray-400 shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none"
        />

        <div className="flex right-4 top-8 absolute">
          {stream.isLoading ? (
            <Button key="stop" onClick={() => stream.stop()}>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Cancel
            </Button>
          ) : (
            <button
              type="submit"
              className="text-[#636AE8]"
              disabled={isLoading || !input.trim()}
            >
              <Send size={20} />
            </button>
          )}
        </div>
        {/* <div className="flex items-center justify-between p-2 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="render-tool-calls"
                checked={hideToolCalls ?? false}
                onCheckedChange={setHideToolCalls}
              />
              <Label
                htmlFor="render-tool-calls"
                className="text-sm text-gray-600"
              >
                Hide Tool Calls
              </Label>
            </div>
          </div>

        </div> */}
      </form>
    </div>
  );
};
