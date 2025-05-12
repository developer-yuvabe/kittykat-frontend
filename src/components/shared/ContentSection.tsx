import { useState } from "react";
import { Copy, Check } from "lucide-react";
import React from "react";
import { BsPinAngle } from "react-icons/bs";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
}

export function ContentSection({ title, content }: ContentSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Extract the text content for copying
      const plainText =
        typeof content === "string" ? content : extractText(content);
      await navigator.clipboard.writeText(plainText);
      setCopied(true);

      // Reset the copy state after a short delay
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (typeof node === "object" && node && React.isValidElement(node)) {
      return React.isValidElement(node)
        ? extractText((node as React.ReactElement<any>).props.children)
        : "";
    }
    return "";
  };

  return (
    <div className="border border-gray-400 rounded-2xl overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[#171a1f]">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="text-[#6e7787] hover:text-[#171a1f] transition"
              aria-label="Copy content"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button className="text-[#6e7787] hover:text-[#171a1f] transition">
              <BsPinAngle size={18} />
            </button>
          </div>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}
