import { ContentSection } from "@/components/shared/ContentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGalleryQuery } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";
import { generateA2iShowboard } from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type ReferenceMoodboardProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
};

const ReferenceMoodboard = ({
  referenceMoodboardId,
  prompts,
}: ReferenceMoodboardProps) => {
  const [n, setN] = React.useState(`${prompts?.length || 0}`);
  const { selectedBrandId } = useBrandStore();
  const { mutate: generateShowboard, isPending } = useMutation({
    mutationFn: () =>
      generateA2iShowboard(selectedBrandId!, referenceMoodboardId!, Number(n)),
  });
  const { galleryItems, isFetching } = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [referenceMoodboardId ?? ""],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    200
  );

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
          {referenceMoodboardId && !isFetching ? (
            <div className="h-max columns-4 gap-[1px]">
              {galleryItems.map((item, idx) => (
                <img
                  key={item.id}
                  src={item.asset_url}
                  alt={`Image ${idx + 1}`}
                  className="w-full break-inside-avoid"
                />
              ))}
            </div>
          ) : (
            <ImageGridSkeleton isLoading={isFetching} />
          )}

          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Prompts</h3>
                  <Input
                    type="number"
                    value={n}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setN("");
                        return;
                      }

                      const parsed = parseInt(value, 10);

                      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
                        setN(value);
                      }
                    }}
                    min={1}
                    max={10}
                  />
                </div>
                {referenceMoodboardId && (
                  <Button
                    variant={"outline"}
                    className="text-primary border-primary"
                    disabled={isPending}
                    onClick={() =>
                      generateShowboard(undefined, {
                        onError: () => {
                          toast.error(
                            `Failed to generate showboard. Please try again.`
                          );
                        },
                      })
                    }
                  >
                    <WandSparkles />
                    {isPending ? "Generating prompts..." : "Generate Prompts"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 auto">
                {prompts.map((prompt) => (
                  <Textarea
                    key={prompt}
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

export const ImageGridSkeleton = ({ isLoading }: { isLoading: boolean }) => {
  const gridItems = [
    { colSpan: 2, rowSpan: 3, colStart: 1, rowStart: 1 },
    { colSpan: 2, rowSpan: 2, colStart: 3, rowStart: 1 },
    { colSpan: 2, rowSpan: 3, colStart: 7, rowStart: 1 },
    { colSpan: 2, rowSpan: 2, colStart: 5, rowStart: 1 },
    { colSpan: 2, rowSpan: 2, colStart: 1, rowStart: 4 },
    { colSpan: 2, rowSpan: 2, colStart: 7, rowStart: 4 },
    { colSpan: 2, rowSpan: 2, colStart: 4, rowStart: 3 },
    { colSpan: 1, rowSpan: 3, colStart: 3, rowStart: 3 },
    { colSpan: 1, rowSpan: 3, colStart: 6, rowStart: 3 },
    { colSpan: 2, rowSpan: 1, colStart: 4, rowStart: 5, extra: "h-24" },
  ];
  return (
    <div
      className={cn("grid grid-cols-8 grid-rows-5 gap-2", {
        "animate-pulse": isLoading,
      })}
    >
      {gridItems.map((item, idx) => {
        const { colSpan = 1, rowSpan = 1, colStart, rowStart, extra } = item;
        return (
          <div
            key={idx}
            className={cn(
              "bg-muted rounded-md",
              `col-span-${colSpan}`,
              `row-span-${rowSpan}`,
              colStart && `col-start-${colStart}`,
              rowStart && `row-start-${rowStart}`,
              extra,
              isLoading && "animate-pulse"
            )}
          />
        );
      })}
    </div>
  );
};
