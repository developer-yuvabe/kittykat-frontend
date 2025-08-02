// components/brand/BrandAnalysisLogsPopover.tsx
"use client";

import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, FileText, XCircle } from "lucide-react";
import { AnalysisLogDetail } from "@/types/types";
import { BrandAnalysisLogs } from "./BrandAnalysisLogs";

export enum AnalysisStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

interface CategorizedLogs {
  active: AnalysisLogDetail[];
  completed: AnalysisLogDetail[];
  failed: AnalysisLogDetail[];
  cancelled: AnalysisLogDetail[];
  all: AnalysisLogDetail[];
  total: number;
}

interface BrandAnalysisLogsPopoverProps {
  categorizedLogs: CategorizedLogs;
}

export const BrandAnalysisLogsPopover: React.FC<
  BrandAnalysisLogsPopoverProps
> = ({ categorizedLogs }) => {
  if (categorizedLogs.total === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative transition-all duration-200 ${
            categorizedLogs.active.length > 0
              ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
              : "hover:bg-gray-50"
          }`}
        >
          <Activity
            className={`w-4 h-4 mr-2 ${
              categorizedLogs.active.length > 0
                ? "animate-spin text-blue-600"
                : ""
            }`}
          />
          Analysis Logs
          {categorizedLogs.active.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 font-bold border-blue-200"
              >
                {categorizedLogs.active.length}
              </Badge>
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[600px] p-0 max-h-[70vh] overflow-y-scroll"
        align="start"
      >
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Analysis Progress
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                All jobs sorted by latest first
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 text-sm mb-1">
                {categorizedLogs.active.length > 0 && (
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    {categorizedLogs.active.length} active
                  </div>
                )}
                {categorizedLogs.completed.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {categorizedLogs.completed.length}
                  </div>
                )}
                {categorizedLogs.failed.length > 0 && (
                  <div className="flex items-center gap-1 text-red-600 font-semibold">
                    <XCircle className="w-3 h-3" />
                    {categorizedLogs.failed.length}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {categorizedLogs.total} total jobs
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[500px]">
          <div className="p-4 space-y-4">
            {categorizedLogs.total === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-semibold text-lg mb-2">
                  No analysis logs yet
                </p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Start uploading images or scraping social media to see
                  progress tracking here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categorizedLogs.all.map((log) => {
                  const isActive =
                    log.status === AnalysisStatus.PENDING ||
                    log.status === AnalysisStatus.IN_PROGRESS ||
                    log.status === "processing";
                  return BrandAnalysisLogs(log, isActive);
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Updates automatically every few seconds</span>
            {categorizedLogs.active.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600 font-medium">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Live tracking active
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
