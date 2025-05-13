import { TfiHome } from "react-icons/tfi";
import { Bell, MessageSquareText, Images, Bot, Menu } from "lucide-react";

export function NavLinks() {
  return (
    <nav className="flex items-center justify-center flex-1">
      <div className="flex items-center space-x-18">
        <button className="flex flex-col gap-y-0.5 items-center text-xs text-[#6e7787]">
          <TfiHome strokeWidth={0.8} size={20} />
          <span>Home</span>
        </button>
        <button className="flex flex-col gap-y-0.5 items-center text-xs text-[#6e7787] relative">
          <MessageSquareText />
          <span>Chats</span>
          <span className="absolute -top-1 -right-[-1px] bg-[#ff3b3b] text-white text-[10px] rounded-full w-3 h-3 flex items-center justify-center">
            2
          </span>
        </button>
        <button className="flex flex-col gap-y-0.5 items-center text-xs text-[#6e7787] relative">
          <Bell size={20} strokeWidth={2.5} />
          <span>Notifications</span>
          <span className="absolute -top-1 -right-[-20px] bg-[#ff3b3b] text-white text-[10px] rounded-full w-3 h-3 flex items-center justify-center">
            3
          </span>
        </button>
        <button className="flex flex-col gap-y-0.5 items-center text-xs text-[#6e7787]">
          <Images size={20} strokeWidth={2} />
          <span>Gallery</span>
        </button>
        <button className="flex flex-col gap-y-0.5 items-center text-xs text-[#7f55e0]">
          <div className="relative">
            <Bot size={20} strokeWidth={2} />
          </div>
          <span className="font-semibold">Ask Kitty Kat</span>
        </button>
        <button className="text-[#6e7787] gap-y-0.5 flex flex-col items-center text-xs">
          <Menu strokeWidth={2} size={20} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
