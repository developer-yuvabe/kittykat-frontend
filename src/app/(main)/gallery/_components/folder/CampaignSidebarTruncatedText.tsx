"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignSidebarTruncatedTextProps {
  text: string;
  className?: string;
}

export function CampaignSidebarTruncatedText({
  text,
  className,
}: CampaignSidebarTruncatedTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [text]);

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <p ref={textRef} className={className}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          <p className="max-w-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <p ref={textRef} className={className}>
      {text}
    </p>
  );
}
