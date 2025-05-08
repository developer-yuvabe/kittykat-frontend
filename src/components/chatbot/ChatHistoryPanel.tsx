import React from "react";
import { motion } from "framer-motion";
import ThreadHistory from "../thread/history";

type ChatHistoryPanelProps = {
  chatHistoryOpen: boolean;
  isLargeScreen: boolean;
};

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  chatHistoryOpen,
  isLargeScreen,
}) => {
  return (
    <motion.div
      className="absolute z-20 h-full m overflow-hidden bg-white border-r"
      style={{ width: 300 }}
      animate={
        isLargeScreen
          ? { x: chatHistoryOpen ? 0 : -300 }
          : { x: chatHistoryOpen ? 0 : -300 }
      }
      initial={{ x: -300 }}
      transition={
        isLargeScreen
          ? { type: "spring", stiffness: 300, damping: 30 }
          : { duration: 0 }
      }
    >
      <div className="relative h-full" style={{ width: 300 }}>
        <ThreadHistory />
      </div>
    </motion.div>
  );
};
