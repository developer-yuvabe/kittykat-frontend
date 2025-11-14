import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

interface A2iAdvancedPromptInputsProps {
  promptValue: string;
  negativePrompt: string[];
  numberOfPrompts: number;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string[]) => void;
  onNumberOfPromptsChange: (value: number) => void;
  disabled?: boolean;
}

export const A2iAdvancedPromptInputs: React.FC<
  A2iAdvancedPromptInputsProps
> = ({
  promptValue,
  negativePrompt,
  numberOfPrompts,
  onPromptChange,
  onNegativePromptChange,
  onNumberOfPromptsChange,
  disabled = false,
}) => {
  const negativePromptString = negativePrompt.join(", ");

  const handleNegativePromptChange = (value: string) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    onNegativePromptChange(items);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt Input */}
      <Textarea
        id="advanced-prompt"
        title="Prompt"
        placeholder="Describe what you want to see in the generated images..."
        className="h-[280px] w-full resize-none"
        variant="inset-label"
        label="Prompt"
        value={promptValue}
        onChange={(e) => onPromptChange(e.target.value)}
        disabled={disabled}
      />

      {/* Negative Prompt Input */}
      <Textarea
        id="advanced-negative-prompt"
        title="Negative Prompt Controls"
        placeholder="More than 2 feet, smoke, warping, distortion..."
        className="h-32 w-full resize-none"
        variant="inset-label"
        label="Negative Prompt Controls"
        value={negativePromptString}
        onChange={(e) => handleNegativePromptChange(e.target.value)}
        disabled={disabled}
      />

      {/* Number of Prompts */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="number-of-prompts" className="text-sm font-medium">
          Number of Prompts to Generate
        </Label>
        <Input
          id="number-of-prompts"
          type="number"
          min={1}
          max={10}
          value={numberOfPrompts}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value >= 1 && value <= 10) {
              onNumberOfPromptsChange(value);
            }
          }}
          disabled={disabled}
          className="w-32"
        />
      </div>
    </div>
  );
};
