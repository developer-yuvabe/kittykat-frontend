import { GeneratedPrompt } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import React, { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { EditIcon } from "@/components/ui/custom-icon";

interface A2iAdvancedPromptResultsProps {
  prompts: GeneratedPrompt[] | undefined;
  isGenerating: boolean;
  conflictNotes?: string;
  onEditPrompt: (prompt: GeneratedPrompt) => void;
  formRef: RefObject<HTMLDivElement | null>;
}

export const A2iAdvancedPromptResults: React.FC<
  A2iAdvancedPromptResultsProps
> = ({ prompts, isGenerating, conflictNotes, onEditPrompt, formRef }) => {
  // Don't render if no prompts and not generating
  if (!prompts?.length && !isGenerating) {
    return null;
  }

  const handleEditClick = (generatedPrompt: GeneratedPrompt) => {
    if (formRef.current) {
      onEditPrompt(generatedPrompt);
      formRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {isGenerating && (
          <div className="w-full">
            {/* Header Skeleton */}
            <div className="flex flex-row gap-x-2 mb-4 items-center">
              <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
              <div className="h-6 w-16 rounded-md bg-muted animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-40 w-full rounded-md bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global Conflict Notes */}
      {conflictNotes && !isGenerating && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Badge
              variant="outline"
              className="border-amber-500 text-amber-700 dark:text-amber-400 shrink-0"
            >
              Note
            </Badge>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {conflictNotes}
            </p>
          </div>
        </div>
      )}

      {/* Generated Prompts Grid */}
      {!isGenerating && prompts && prompts.length > 0 && (
        <div>
          <div className="flex flex-row gap-x-2 ">
            <h1 className="font-semibold text-lg">Prompts</h1>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {prompts.map((generatedPrompt, index) => (
              <div key={index} className="relative flex flex-col gap-2">
                {/* Prompt Number Badge */}

                {/* Main Prompt Textarea */}
                <Textarea
                  value={generatedPrompt.prompt}
                  readOnly
                  className="min-h-40 max-h-40 scrollbar resize-none"
                />
                <Button
                  variant="ghost"
                  className="absolute bottom-2 right-2"
                  size="icon"
                  onClick={() => handleEditClick(generatedPrompt)}
                >
                  <EditIcon />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
