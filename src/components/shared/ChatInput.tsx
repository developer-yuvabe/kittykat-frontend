"use client";

import type React from "react";

import { useState } from "react";
import { Send, Plus, Share } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="bg-white rounded-lg p-2 flex items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Message"
            className="w-full border-none focus:outline-none h-18 text-sm px-2 py-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-x-2 px-2">
          <button type="button" className="text-[#636AE8]">
            <Share size={16} />
          </button>
          <button
            type="submit"
            className="text-[#636AE8]"
            disabled={!message.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
