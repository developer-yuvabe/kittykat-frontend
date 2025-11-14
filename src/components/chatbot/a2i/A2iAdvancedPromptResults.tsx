import { GeneratedPrompt } from "@/types/types";
import { WandSparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface A2iAdvancedPromptResultsProps {
  prompts: GeneratedPrompt[] | undefined;
  isGenerating: boolean;
  conflictNotes?: string;
}

export const A2iAdvancedPromptResults: React.FC<
  A2iAdvancedPromptResultsProps
> = ({ prompts, isGenerating, conflictNotes }) => {
  // Don't render if no prompts and not generating
  if (!prompts?.length && !isGenerating) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <WandSparkles className="h-4 w-4 animate-pulse text-primary" />
            Generating prompts...
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
        <div className="grid grid-cols-3 gap-4">
          {prompts.map((generatedPrompt, index) => (
            <div key={index} className="relative flex flex-col gap-2">
              {/* Prompt Number Badge */}

              {/* Main Prompt Textarea */}
              <Textarea
                value={generatedPrompt.prompt}
                readOnly
                className="min-h-40 max-h-40 scrollbar resize-none"
              />

              {/* Conflict Notes */}
              {generatedPrompt.conflict_notes && (
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {generatedPrompt.conflict_notes}
                  </p>
                </div>
              )}

              {/* Reference Images */}
              {/* {(generatedPrompt.product_references.length > 0 ||
                generatedPrompt.context_references.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {generatedPrompt.product_references.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Product:
                      </span>
                      <div className="flex gap-1">
                        {generatedPrompt.product_references.map((ref, i) => (
                          <img
                            key={i}
                            src={ref}
                            alt={`Product ${i + 1}`}
                            className="h-8 w-8 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {generatedPrompt.context_references.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Context:
                      </span>
                      <div className="flex gap-1">
                        {generatedPrompt.context_references.map((ref, i) => (
                          <img
                            key={i}
                            src={ref}
                            alt={`Context ${i + 1}`}
                            className="h-8 w-8 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
