import React from "react";
import { SquarePen } from "lucide-react";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

type ChatHeaderProps = {
  setThreadId: (id: string | null) => void;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({ setThreadId }) => {
  return (
    <div className="relative z-10 flex items-center justify-between gap-3 p-2">
      <div className="relative flex flex-row gap-2"></div>

      <div className="flex items-center gap-4">
        <TooltipIconButton
          size="lg"
          className="p-4"
          tooltip="New thread"
          variant="ghost"
          onClick={() => setThreadId(null)}
        >
          <SquarePen className="size-5" />
        </TooltipIconButton>
      </div>
    </div>
  );
};
