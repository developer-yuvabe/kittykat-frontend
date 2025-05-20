"use client";

import { Trash2, Download, Send, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { PiShareFat } from "react-icons/pi";

interface BulkActionsProps {
  selectedCount: number;
  onUnselectAll: () => void;
}

export function BulkActions({
  selectedCount,
  onUnselectAll,
}: BulkActionsProps) {
  return (
    <div className="fixed bottom-0 left-0  right-0 bg-white border-t shadow-lg py-3 px-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-end gap-x-2">
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <PiShareFat className="h-4  w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          onClick={onUnselectAll}
          className="bg-[#9095A0] hover:bg-[#9095A0]"
        >
          Unselect All
        </Button>

        <Button
          variant="default"
          className="flex items-center gap-2 bg-[#9095A0] hover:bg-[#9095A0]"
        >
          <span>Add to library</span>
          <BookOpen className="pt-[2px]" />
        </Button>
        <Button className="bg-[#636AE8] hover:bg-[#636AE8] flex items-center gap-2">
          <span>Send to Kitty</span>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
