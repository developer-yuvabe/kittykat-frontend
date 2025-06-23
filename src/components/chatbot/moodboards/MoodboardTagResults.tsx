import { ContentSection } from "@/components/shared/ContentSection";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { MoodboardInformation } from "@/types/types";
import React from "react";
import { RenderValue } from "../DynamicSection";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

function MoodboardTagResults({
  moodboard_tags,
}: {
  moodboard_tags: MoodboardInformation["moodboard_tags"];
}) {
  if (!moodboard_tags || Object.keys(moodboard_tags).length === 0) {
    return null;
  }

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
      <Button className="w-full" onClick={() => {}}>
        <Brain /> A2i Showboard Generation
      </Button>
    </div>
  );
}

export default MoodboardTagResults;
