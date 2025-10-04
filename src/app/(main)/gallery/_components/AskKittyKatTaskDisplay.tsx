"use client";

import React from "react";
import { CheckCircle2, Edit3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/thread/markdown-text";
import { Task } from "@/types/tasklist.types";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface AskKittyKatTaskDisplayProps {
  tasks: Task[];
  showCredits: boolean;
  totalCredits: number;
  onEditAll: () => void;
  isEditing: boolean;
}

export function AskKittyKatTaskDisplay({
  tasks,
  showCredits,
  totalCredits,
  onEditAll,
  isEditing,
}: AskKittyKatTaskDisplayProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} identified
          </span>
        </div>
        <div className="flex items-center gap-3">
          {showCredits && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-semibold text-purple-600">
                {totalCredits} credits
              </span>
              <TooltipIconButton tooltip="This amount will be deducted now. Final cost may be adjusted after review.">
                <Info />
              </TooltipIconButton>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onEditAll}
            disabled={isEditing}
            className="h-7 px-2"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Task List */}
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li
            key={index}
            className="flex items-start justify-between rounded-md bg-white px-3 py-2 shadow-sm border border-gray-200"
          >
            {/* Task Description */}
            <div className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
              <div className="text-sm text-gray-700 leading-relaxed">
                <MarkdownText>{task.task}</MarkdownText>
              </div>
            </div>

            {/* Credits (if enabled) */}
            {showCredits && (
              <span className="text-xs font-medium text-purple-600 whitespace-nowrap ml-4">
                {task.estimated_credit} credits
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
