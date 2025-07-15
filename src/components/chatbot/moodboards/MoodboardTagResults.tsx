import { ContentSection } from "@/components/shared/ContentSection";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { MoodboardInformation } from "@/types/types";
import React from "react";
import { RenderValue } from "../DynamicSection";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";

function MoodboardTagResults({
  moodboard_tags,
  moodboardId,
}: {
  moodboard_tags: MoodboardInformation["moodboard_tags"];
  moodboardId?: MoodboardInformation["id"];
}) {
  if (!moodboard_tags || Object.keys(moodboard_tags).length === 0) {
    return null;
  }

  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard, isPending } = useMutation({
    mutationFn: () => generateA2iShowboard(selectedBrandId!, moodboardId!),
  });

  return (
    <div className="mt-4 space-y-6">
      {Object.entries(moodboard_tags).map(([key, value]) => (
        <ContentSection
          key={key}
          title={capitalizeKey(key)}
          content={
            <div className="ml-2 space-y-2">
              <RenderValue
                value={value}
                path={`dynamic.${key}`}
                enableEdit={false}
              />
            </div>
          }
          context={undefined}
        />
      ))}
      <Button
        className="w-full"
        onClick={() =>
          generateShowboard(undefined, {
            onSuccess: () => {
              toast.success("Concept Visual prompts generated successfully!");
            },

            onError: () => {
              toast.error(
                "Failed to generate Concept Visual prompts. Please try again."
              );
            },
          })
        }
        disabled={isPending}
      >
        {isPending ? (
          <Loader />
        ) : (
          <>
            <Brain /> A2i Concept Visual Generation
          </>
        )}
      </Button>
    </div>
  );
}

export default MoodboardTagResults;
