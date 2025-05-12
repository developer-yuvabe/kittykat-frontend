import { useState } from "react";
import { Copy, Check } from "lucide-react";
import React from "react";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
  context: any;
}

export function ContentSection({
  title,
  content,
  context,
}: ContentSectionProps) {
  const [copied, setCopied] = useState(false);
  const { addPinnedItem, removePinnedItem, isPinned, getPinnedItemId } =
    usePinnedContextStore();
  const isPinnedItem = isPinned(context);

  const handleCopy = async () => {
    try {
      // Copy only the context
      const contextText =
        typeof context === "string" ? context : JSON.stringify(context);
      await navigator.clipboard.writeText(contextText);
      setCopied(true);

      // Reset the copy state after a short delay
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handlePin = () => {
    if (isPinnedItem) {
      const itemId = getPinnedItemId(context);
      if (itemId) {
        removePinnedItem(itemId);
      }
    } else {
      addPinnedItem(title, context);
    }
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
              aria-label="Copy context"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={handlePin}
              className={`transition ${
                isPinnedItem
                  ? "text-blue-500"
                  : "text-[#6e7787] hover:text-[#171a1f]"
              }`}
              aria-label={isPinnedItem ? "Unpin context" : "Pin context"}
            >
              {isPinnedItem ? (
                <BsPinAngleFill size={18} />
              ) : (
                <BsPinAngle size={18} />
              )}
            </button>
          </div>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}
