import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface A2iAdvancedPromptInputsProps {
  promptValue: string;
  negativePrompt: string;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  disabled?: boolean;
}

export const A2iAdvancedPromptInputs: React.FC<
  A2iAdvancedPromptInputsProps
> = ({
  promptValue,
  negativePrompt,
  onPromptChange,
  onNegativePromptChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-4 mt-5">
      {/* Prompt Input */}
      <Textarea
        id="advanced-prompt"
        title="Prompt"
        placeholder="Describe what you want to see in the generated images..."
        className="h-[440px] w-full resize-none"
        variant="inset-label"
        label="Prompt"
        value={promptValue}
        onChange={(e) => onPromptChange(e.target.value)}
        disabled={disabled}
      />

      {/* Negative Prompt Input */}
      <div className="mt-2">
        <Textarea
          id="advanced-negative-prompt"
          title="Negative Prompt Controls"
          placeholder="More than 2 feet, smoke, warping, distortion..."
          className="h-36 w-full resize-none"
          variant="inset-label"
          label="Negative Prompt Controls"
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
