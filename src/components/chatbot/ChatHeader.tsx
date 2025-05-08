import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PanelRightOpen, PanelRightClose, Bot, SquarePen } from "lucide-react";
import Logo from "@/assets/kittykat-logo.svg";
import { TooltipIconButton } from "../thread/tooltip-icon-button";

type ChatHeaderProps = {
  chatHistoryOpen: boolean;
  isLargeScreen: boolean;
  setChatHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setThreadId: (id: string | null) => void;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatHistoryOpen,
  isLargeScreen,
  setChatHistoryOpen,
  setThreadId,
}) => {
  return (
    <div className="relative z-10 flex items-center justify-between gap-3 p-2">
      <div className="relative flex flex-row gap-2">
        {/* <motion.button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setThreadId(null)}
          animate={{
            marginLeft: !chatHistoryOpen ? 48 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <Image
            src={Logo}
            alt="LangGraph Logo"
            width={100}
            height={42}
            className="flex-shrink-0"
          />
          <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            CMO Assistant
            <Bot className="w-5 h-5" />
          </span>
        </motion.button> */}
      </div>

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
