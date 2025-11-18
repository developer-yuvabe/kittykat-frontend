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
  // Define all functions BEFORE any conditional returns
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

  // Determine skeleton count based on user input or existing prompts
  const skeletonCount =
    typeof n === "number" && n > 0 ? n : prompts?.length || 3;

  // Show loading skeletons when generating
  if (isGenerating) {
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
              className="w-16"
              disabled
            />
          </div>
          {referenceMoodboardId && (
            <Button
              variant={"outline"}
              className="text-primary border-primary"
              disabled={true}
            >
              <WandSparkles />
              Generating prompts...
            </Button>
          )}
        </div>

        {/* Same responsive grid as actual prompts */}
        <div
          className={`grid gap-4 ${
            skeletonCount === 1
              ? "grid-cols-1 max-w-3xl mx-auto"
              : skeletonCount === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="group relative rounded-lg border border-border bg-card p-4"
            >
              <div className="h-40 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!prompts || prompts.length === 0) {
    return null;
  }

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
            className="w-16"
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
            Generate Prompts
          </Button>
        )}
      </div>

      {/* Updated grid with dynamic columns based on prompt count */}
      <div
        className={`grid gap-4 ${
          prompts.length === 1
            ? "grid-cols-1 max-w-3xl mx-auto"
            : prompts.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {prompts.map((prompt, index) => (
          <div
            key={`${prompt}-${index}`}
            className="group relative rounded-lg border border-border bg-card p-4"
          >
            <Textarea
              value={prompt}
              readOnly
              tabIndex={-1}
              className="min-h-40 max-h-40 scrollbar border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none"
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
