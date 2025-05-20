import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TfiHome } from "react-icons/tfi";
import { Bell, MessageSquareText, Images, Bot, Menu } from "lucide-react";

export function NavLinks() {
  const pathname = usePathname();

  const router = useRouter();

  // Function to determine if a route is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Function to get text color based on active state
  const getTextColor = (path: string) => {
    return isActive(path) ? "text-[#7f55e0]" : "text-[#6e7787]";
  };

  // Function to get font weight based on active state
  const getFontWeight = (path: string) => {
    return isActive(path) ? "font-semibold" : "";
  };

  return (
    <nav className="flex items-center justify-center flex-1">
      <div className="flex items-center space-x-8  md:space-x-16">
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/"
          )} ${getFontWeight("/")}`}
          onClick={() => router.push("/")}
        >
          <TfiHome strokeWidth={0.8} size={20} />
          <span>Home</span>
        </button>
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/chats"
          )} ${getFontWeight("/chats")} relative`}
        >
          <MessageSquareText />
          <span>Chats</span>
          <span className="absolute -top-1 -right-[-1px] bg-[#ff3b3b] text-white text-[10px] rounded-full w-3 h-3 flex items-center justify-center">
            2
          </span>
        </button>
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/notifications"
          )} ${getFontWeight("/notifications")} relative`}
        >
          <Bell size={20} strokeWidth={2.5} />
          <span>Notifications</span>
          <span className="absolute -top-1 -right-[-20px] bg-[#ff3b3b] text-white text-[10px] rounded-full w-3 h-3 flex items-center justify-center">
            3
          </span>
        </button>
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/gallery"
          )} ${getFontWeight("/gallery")}`}
          onClick={() => router.push("/gallery")}
        >
          <Images size={20} strokeWidth={2} />
          <span>Gallery</span>
        </button>
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/ask"
          )} ${getFontWeight("/ask")}`}
        >
          <div className="relative">
            <Bot size={20} strokeWidth={2} />
          </div>
          <span>Ask Kitty Kat</span>
        </button>
        <button
          className={`flex flex-col cursor-pointer gap-y-0.5 items-center text-xs ${getTextColor(
            "/menu"
          )} ${getFontWeight("/menu")}`}
        >
          <Menu strokeWidth={2} size={20} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
