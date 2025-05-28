"use client";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import React from "react";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import { toast } from "sonner";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { PinIcon } from "../ui/custom-icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // <- import Accordion
import { Context } from "@/types/types";
import { cn } from "@/lib/utils";
import { isEqual } from "lodash";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
  context?: Context;
  collapsible?: boolean;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  variant?: "default" | "minimal" | "outlined";
  size?: "sm" | "md" | "lg";
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showCopy?: boolean;
  showPin?: boolean;
  customActions?: React.ReactNode;
}

export function ContentSection({
  title,
  content,
  context,
  collapsible = false,
  defaultOpen = true,
  onToggle,
  variant = "default",
  size = "md",
  className = "",
  headerClassName = "hover:no-underline",
  contentClassName = "",
  showCopy = true,
  showPin = true,
  customActions,
}: ContentSectionProps) {
  const [copied, setCopied] = useState(false);
  const { addPinnedItem, removePinnedItem, pinnedItem } =
    usePinnedContextStore();
  const isPinned = useMemo(() => {
    return (
      pinnedItem?.title === title &&
      isEqual(pinnedItem?.context?.data, context?.data)
    );
  }, [pinnedItem, content, title]);

  const handleCopy = async () => {
    if (!context) return;
    try {
      const contextText =
        typeof context === "string" ? context : JSON.stringify(context.data);
      await navigator.clipboard.writeText(contextText);
      setCopied(true);
      toast.success(`${title} has been copied`, { position: "top-right" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast.error("Failed to copy context", { position: "top-right" });
    }
  };

  const handlePin = () => {
    if (!context) return;

    if (isPinned) {
      removePinnedItem();
      toast(`${title} has been unpinned`, { position: "top-right" });
    } else {
      addPinnedItem({ title, context });
      toast(`${title} has been pinned`, { position: "top-right" });
    }
  };

  const shouldShowActions = context && (showCopy || showPin || customActions);

  const variantStyles = {
    default: "border border-gray-400 rounded-2xl overflow-hidden",
    minimal: "border-b border-gray-200",
    outlined: "border-2 border-gray-300 rounded-lg shadow-sm",
  };

  const sizeStyles = {
    sm: { padding: "p-2", titleSize: "text-xs", spacing: "space-x-1" },
    md: { padding: "p-3", titleSize: "text-sm", spacing: "space-x-2" },
    lg: { padding: "p-4", titleSize: "text-base", spacing: "space-x-3" },
  };

  const currentSize = sizeStyles[size];

  if (collapsible) {
    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "item-1" : undefined}
        onValueChange={(val) => onToggle?.(!!val)}
        className={`${variantStyles[variant]} ${className}`}
      >
        <AccordionItem value="item-1" className="group">
          <AccordionTrigger
            className={`${currentSize.padding} ${headerClassName}`}
          >
            <div className="flex w-full justify-between items-center">
              <div className="flex items-center gap-2">
                <h3
                  className={`${currentSize.titleSize} font-medium text-[#171a1f]`}
                >
                  {title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {shouldShowActions && (
                  <div className={`flex items-center ${currentSize.spacing}`}>
                    {customActions}
                    {showCopy && (
                      <TooltipIconButton
                        tooltip="Copy context"
                        onClick={handleCopy}
                        className="text-[#6e7787] hover:text-[#171a1f] transition"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </TooltipIconButton>
                    )}
                    {showPin && (
                      <TooltipIconButton
                        tooltip={
                          pinnedItem?.title === title
                            ? "Unpin context"
                            : "Pin context"
                        }
                        onClick={handlePin}
                        className={`transition ${
                          pinnedItem?.title === title
                            ? "text-blue-500"
                            : "text-[#6e7787] hover:text-[#171a1f]"
                        }`}
                      >
                        {pinnedItem?.title === title ? (
                          <PinIcon size={18} color="#636AE8" />
                        ) : (
                          <PinIcon size={18} />
                        )}
                      </TooltipIconButton>
                    )}
                  </div>
                )}

                {/* Always show this text at the end */}
                <span className="text-[12px] text-[#6e7787] ml-2 hidden group-data-[state=closed]:block">
                  Click to expand
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent
            className={`${currentSize.padding} ${contentClassName}`}
          >
            {content}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // If not collapsible, fall back to static section
  return (
    <div className="border border-gray-400 rounded-2xl overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#171a1f]">{title}</h3>

          {shouldShowActions && (
            <div className={`flex items-center ${currentSize.spacing}`}>
              {customActions}
              {showCopy && (
                <TooltipIconButton
                  tooltip="Copy context"
                  onClick={handleCopy}
                  className="text-[#6e7787] hover:text-[#171a1f] transition"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </TooltipIconButton>
              )}
              {showPin && (
                <TooltipIconButton
                  tooltip={
                    pinnedItem?.title === title
                      ? "Unpin context"
                      : "Pin context"
                  }
                  onClick={handlePin}
                  className={`transition ${
                    pinnedItem?.title === title
                      ? "text-blue-500"
                      : "text-[#6e7787] hover:text-[#171a1f]"
                  }`}
                >
                  {pinnedItem?.title === title ? (
                    <PinIcon size={18} color="#636AE8" />
                  ) : (
                    <PinIcon size={18} />
                  )}
                </TooltipIconButton>
              )}
            </div>
          )}
        </div>
        <div className={`${contentClassName}`}>{content}</div>
      </div>
    </div>
  );
}
