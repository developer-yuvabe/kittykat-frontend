import { Copy } from "lucide-react";
import type React from "react";
import { BsPinAngle } from "react-icons/bs";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
}

export function ContentSection({ title, content }: ContentSectionProps) {
  return (
    <div className="border border-gray-400 rounded-2xl  overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[#171a1f]">{title}</h3>
          <div className="flex items-center space-x-2">
            <button className="text-[#6e7787]">
              <Copy size={16} />
            </button>
            <button className="text-[#6e7787]">
              <BsPinAngle size={18} />
            </button>
          </div>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}
