import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditIcon } from "@/components/ui/custom-icon";
import { WandSparkles } from "lucide-react";
import { MoodboardInformation } from "@/types/types";
import { RefObject } from "react";
import { toast } from "sonner";

type ReferenceMoodboardPromptsProps = {
  prompts: string[] | null;
  n: number | "";
  setN: (value: number | "") => void;
  selectedMoodboard: MoodboardInformation | undefined;
  referenceMoodboardId: string | null;
  isGenerating: boolean;
  onGenerate: (numberOfPrompts: number) => void;
  onEditPrompt: (prompt: string) => void;
  formRef: RefObject<HTMLDivElement | null>;
};

export const ReferenceMoodboardPrompts = ({
  prompts,
  n,
  setN,
  selectedMoodboard,
  referenceMoodboardId,
  isGenerating,
  onGenerate,
  onEditPrompt,
  formRef,
}: ReferenceMoodboardPromptsProps) => {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "") {
      setN("");
      return;
    }

    const num = parseInt(val, 10);

    if (!isNaN(num) && num >= 1 && num <= 3) {
      setN(num);
    }
  };

  const handleGenerateClick = () => {
    const hasTags =
      selectedMoodboard?.moodboard_tags &&
      Object.keys(selectedMoodboard.moodboard_tags).length > 0 &&
      Object.values(selectedMoodboard.moodboard_tags).some(
        (tagArray) => tagArray.length > 0
      );

    if (hasTags) {
      onGenerate(Number(n));
    } else {
      toast.warning(
        "Please ensure your moodboard has at least one image with tags before generating prompts."
      );
    }
  };

  const handleEditClick = (prompt: string) => {
    if (formRef.current) {
      onEditPrompt(prompt);
      formRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold">Prompts</h3>
          <Input
            type="number"
            value={n}
            onChange={handleChange}
            onPaste={(e) => e.preventDefault()}
            min={1}
            max={3}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>
        {referenceMoodboardId && (
          <Button
            variant={"outline"}
            className="text-primary border-primary"
            disabled={isGenerating}
            onClick={handleGenerateClick}
          >
            <WandSparkles />
            {isGenerating ? "Generating prompts..." : "Generate Prompts"}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 auto">
        {prompts.map((prompt) => (
          <div key={prompt} className="relative">
            <Textarea
              value={prompt}
              readOnly
              className="min-h-40 max-h-40 scrollbar"
            />
            <Button
              variant="ghost"
              className="absolute bottom-2 right-2"
              size="icon"
              onClick={() => handleEditClick(prompt)}
            >
              <EditIcon />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
