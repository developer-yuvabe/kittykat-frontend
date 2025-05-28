// components/PromptInput.tsx

import { Textarea } from "@/components/ui/textarea";
import { ContentSection } from "@/components/shared/ContentSection";

type PromptInputProps = {
  prompt: string;
  setPrompt: (value: string) => void;
};

export const PromptInput = ({ prompt, setPrompt }: PromptInputProps) => {
  return (
    <ContentSection
      title="Prompt"
      content={
        <div>
          <p className="text-sm text-[#171A1F]">{prompt}</p>
        </div>
      }
    />
  );
};
