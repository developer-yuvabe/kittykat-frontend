import { ContentSection } from "@/components/shared/ContentSection";
import { ThreadA2iImage } from "@/types/types";
import React from "react";

type ReferenceMoodboardProps = {
  referenceMoodboard?: ThreadA2iImage["reference_moodboard"];
};

const ReferenceMoodboard = ({
  referenceMoodboard,
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
        <div>
          {referenceMoodboard?.moodboard_id ? (
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
        </div>
      }
    />
  );
};

export default ReferenceMoodboard;
