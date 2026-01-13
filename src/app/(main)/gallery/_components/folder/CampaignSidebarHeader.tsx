"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CampaignSidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CampaignSidebarHeader({
  searchQuery,
  onSearchChange,
}: CampaignSidebarHeaderProps) {
  return (
    <div className="relative max-w-64">
      <Search className="absolute left-3 inset-y-0 my-auto h-3 w-3 text-gray-400" />
      <Input
        type="text"
        placeholder="Search campaigns..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="
    pl-9 h-8 text-xs py-0 placeholder:text-xs
    focus:outline-none
    focus:ring-0
    focus:border-transparent
    focus-visible:outline-none
    focus-visible:ring-0
    focus-visible:ring-offset-0
    shadow-none
  "
      />
    </div>
  );
}
