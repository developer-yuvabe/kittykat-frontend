import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";

type StyleAnalysisStatusProps = {
  status: string | undefined;
  progress: number | null | undefined;
  progressMessages?: string[] | null | undefined;
};

const getAnalysisStatusMessage = (status: string | undefined): string => {
  switch (status) {
    case "not_started":
      return "Ready to analyze your style";
    case "in_progress":
      return "Analyzing your style...";
    case "completed":
      return "Analysis Complete!";
    case "failed":
      return "Analysis failed - please try again";
    case "partially_completed":
      return "Analysis partially completed";
    default:
      return "Ready to analyze your style";
  }
};

export const MoodboardStyleAnalysisStatus: React.FC<
  StyleAnalysisStatusProps
> = ({ status, progress, progressMessages = [] }) => {
  if (!status || status === "not_started") return null;

  const statusMessage = getAnalysisStatusMessage(status);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-800">{statusMessage}</h3>
          {progressMessages && progressMessages?.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <InfoIcon className="h-4 w-4 text-gray-500" />
                  <span className="sr-only">View analysis details</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Analysis Progress</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-600">
                    {progressMessages?.map((message, index) => (
                      <p key={index}>{message}</p>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2 transition-all duration-300" />
    </div>
  );
};
