import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import React from "react";

interface A2iAdvancedPromptActionsProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const A2iAdvancedPromptActions: React.FC<
  A2iAdvancedPromptActionsProps
> = ({ onGenerate, isGenerating, disabled = false }) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        className="min-w-[160px]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Prompts
          </>
        )}
      </Button>
    </div>
  );
};
