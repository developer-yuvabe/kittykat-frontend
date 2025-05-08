"use client";

import { useState } from "react";
import { LeftPanel } from "./LeftPanel";
import { ChatPanel } from "@/components/shared/ChatPanel";

export function KittyKatInterface() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className=" bg-white">
      <div className="flex flex-col bg-white md:flex-row w-full">
        <LeftPanel
          expandedSection={expandedSection}
          toggleSection={toggleSection}
        />
        <ChatPanel />
      </div>
    </div>
  );
}
