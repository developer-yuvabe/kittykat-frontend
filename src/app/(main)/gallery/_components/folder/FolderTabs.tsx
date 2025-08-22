"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

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
];

export function FolderTabs({
  activeTab,
  onTabChange,
  title = "Subfolders",
}: FolderTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full mb-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{tabs.length} folders</span>
      </div>

      {/* Scrollable Tabs */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-50 rounded-full h-8 w-8 p-0"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-50 rounded-full h-8 w-8 p-0"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Folder Tabs */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-shrink-0 bg-white border rounded-lg p-4 flex items-center space-x-3 cursor-pointer group transition-all duration-200 min-w-[220px]
                ${
                  activeTab === tab.value
                    ? "border-purple-400 shadow-md"
                    : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                }`}
              role="button"
              tabIndex={0}
            >
              {/* Folder Icon */}
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Folder className="w-5 h-5 text-purple-600" />
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-medium truncate transition-colors mt-1 ${
                    activeTab === tab.value
                      ? "text-purple-700"
                      : "text-gray-900 group-hover:text-purple-700"
                  }`}
                >
                  {tab.label}
                </h3>
              </div>

              {/* Chevron */}
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors rotate-[-90deg]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
