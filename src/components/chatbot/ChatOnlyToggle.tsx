import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/store/thread.store";
import { Switch } from "../ui/switch";

const ChatOnlyToggle = () => {
  const { chatOnlyMode, setChatOnlyMode } = useThreadStore();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "text-primary hover:bg-transparent rounded-md cursor-pointer p-2 transition-colors duration-200 ease-in-out text-xs flex items-center gap-2",
              {
                "bg-primary/10 hover:bg-primary/10": chatOnlyMode,
              }
            )}
          >
            Chat Only Mode
            <Switch
              className="bg-primary/50"
              id="chat-only-mode"
              checked={chatOnlyMode}
              onCheckedChange={(checked) => setChatOnlyMode(checked)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            {chatOnlyMode
              ? "Chat-only mode is active. Media generation is unavailable."
              : "Chat-only mode is off. You can generate media."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ChatOnlyToggle;
