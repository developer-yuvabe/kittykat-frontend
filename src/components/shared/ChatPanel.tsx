"use client";

import { useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import KittkatIcon from "@/app/favicon.ico";

export function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "user",
      content:
        "Nulla fugiat ullamco qui fugiat quis exercitation ex. Consequat nisi dolor.",
      avatar: KittkatIcon,
    },
    {
      id: 2,
      sender: "kittykat",
      content:
        "Eiusmod cillum cupidatat velit adipisicing amet magna reprehenderit sint duis. Do esse velit aliquip occaecat laborum",
      avatar: KittkatIcon,
    },
    {
      id: 3,
      sender: "user",
      content:
        "Qui aliquip quis pariatur et commodo officia irure dolore repreh",
      avatar: KittkatIcon,
    },
    {
      id: 4,
      sender: "kittykat",
      content:
        "Sit minim occaecat nisi officia fugiat magna exercitation sint sunt qui sit sint excepteur laborum ex. Duis sit ea ex ullamco do amet velit.Mollit nostrud labore duis officia",
      avatar: KittkatIcon,
    },
  ]);

  const addMessage = (content: string) => {
    const newUserMessage = {
      id: messages.length + 1,
      sender: "user",
      content,
      avatar: KittkatIcon,
    };

    setMessages([...messages, newUserMessage]);

    // Simulate KittyKat response
    setTimeout(() => {
      const kittyKatResponse = {
        id: messages.length + 2,
        sender: "kittykat",
        content:
          "I'll help you with that request about the Yuvabe brand. Let me analyze the information and provide some suggestions for your campaign.",
        avatar: KittkatIcon,
      };
      setMessages((prev) => [...prev, kittyKatResponse]);
    }, 1000);
  };

  return (
    <div className="w-full md:w-[35%] mb-4 rounded-2xl mx-4 bg-[#F3F4F6] p-4 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            sender={message.sender}
            content={message.content}
            avatar={message.avatar}
          />
        ))}
      </div>

      <ChatInput onSendMessage={addMessage} />
    </div>
  );
}
