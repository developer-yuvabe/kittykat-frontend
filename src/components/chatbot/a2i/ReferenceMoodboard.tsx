import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThreadA2iImage } from "@/types/types";
import React from "react";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
}: ReferenceMoodboardProps) => {
  return (
    <ContentSection
      title="Reference Moodboard"
      showCopy={false}
      showPin={false}
      context={{
        data: {},
      }}
      content={
        <div className="space-y-4">
          {referenceMoodboardId ? (
            <></>
          ) : (
            <div className="grid grid-cols-8 grid-rows-5 gap-2">
              <div className="col-span-2 row-span-3 bg-muted rounded-md" />
              <div className="col-span-2 row-span-2 col-start-3 bg-muted rounded-md" />
              <div className="col-span-2 row-span-3 col-start-7 row-start-1 bg-muted rounded-md" />
              <div className="col-span-2 row-span-2 col-start-5 row-start-1 bg-muted rounded-md" />
              <div className="col-span-2 row-span-2 col-start-1 row-start-4  bg-muted rounded-md" />
              <div className="col-span-2 row-span-2 col-start-7 row-start-4  bg-muted rounded-md" />
              <div className="col-span-2 row-span-2 col-start-4 row-start-3 bg-muted rounded-md" />
              <div className="row-span-3 col-start-3 row-start-3 bg-muted rounded-md" />
              <div className="row-span-3 col-start-6 row-start-3 bg-muted rounded-md" />
              <div className="col-span-2 col-start-4 row-start-5 bg-muted rounded-md h-24" />
            </div>
          )}

          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3>Prompts</h3>
                </div>
                <Button variant={"outline"}>Generate Prompts</Button>
              </div>
              <div className="grid grid-cols-3 gap-4 auto">
                {prompts.map((prompt, index) => (
                  <Textarea
                    key={index}
                    value={prompt}
                    readOnly
                    className="min-h-40 max-h-40"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export default ReferenceMoodboard;
