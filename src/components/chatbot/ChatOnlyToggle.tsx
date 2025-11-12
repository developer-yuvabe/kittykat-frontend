import { MessageSquareText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/store/thread.store";

const ChatOnlyToggle = () => {
  const { chatOnlyMode, setChatOnlyMode } = useThreadStore();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setChatOnlyMode(!chatOnlyMode)}
            type="button"
            className={cn(
              "text-primary border border-primary hover:bg-transparent rounded-md cursor-pointer p-2 transition-colors duration-200 ease-in-out",
              {
                "bg-primary/10 hover:bg-primary/10": chatOnlyMode,
              }
            )}
          >
            <MessageSquareText size={20} />
          </button>
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
