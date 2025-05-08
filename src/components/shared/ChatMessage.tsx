import { MoreVertical } from "lucide-react";
import { StaticImageData } from "next/image";
import Image from "next/image";

interface ChatMessageProps {
  sender: string;
  content: string;
  avatar: string | StaticImageData;
}

export function ChatMessage({ sender, content, avatar }: ChatMessageProps) {
  const isUser1 = sender !== "kittykat"; // Assuming "kittykat" is one user and anyone else is the other

  return (
    <div
      className={`flex w-full ${
        isUser1 ? "justify-end" : "justify-start"
      } mb-3`}
    >
      <div className="max-w-[90%]">
        <div
          className={`relative p-3 rounded-2xl text-sm leading-relaxed shadow-sm flex items-start gap-2
            ${
              isUser1
                ? "bg-white text-[#323842]"
                : "bg-[#F2F2FD] text-[#323842]"
            }`}
        >
          {/* Avatar always inside bubble on the left */}
          <div className="flex-shrink-0 mr-1">
            <Image
              src={avatar || "/placeholder.svg"}
              alt={sender}
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8"
            />
          </div>

          <p className="flex-grow">{content}</p>

          {!isUser1 && (
            <button className="absolute top-2 right-2 text-[#6e7787]">
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
