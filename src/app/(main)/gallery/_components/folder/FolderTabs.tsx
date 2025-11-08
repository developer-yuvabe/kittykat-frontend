"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
}

interface FolderTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  title?: string;
}

const tabs: Tab[] = [
  { value: "all-media", label: "All Media" },
  { value: "brand-uploads", label: "Brand Uploads" },
  { value: "moodboard", label: "Moodboards" },
  { value: "showboard-media", label: "Concept Visuals" },
  { value: "a2i-media", label: "A2i Media" },
  { value: "products", label: "Products" },
];

export function FolderTabs({ activeTab, onTabChange }: FolderTabsProps) {
  return (
    <div className="w-full border-b bg-[#F9FAFB]">
      <div className="grid grid-cols-6 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "text-sm font-medium text-gray-600 hover:text-gray-900 py-3 px-4 transition-all border-b-2 border-transparent",
              activeTab === tab.value &&
                "border-[#636AE8] text-[#636AE8] bg-[#F3F4F6]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
