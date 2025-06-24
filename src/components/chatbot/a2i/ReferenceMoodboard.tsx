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

  console.log(galleryItems);

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
            <div
              className="h-full overflow-y-auto pb-20"
              style={{
                columnCount: "auto",
                columnWidth: "300px",
                columnGap: "16px",
                height: "calc(100vh - 120px)",
              }}
            >
              {galleryItems.map((item, index) => (
                <div
                  key={item.asset_url}
                  className="break-inside-avoid mb-4 group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105">
                    <img
                      src={item.asset_url}
                      alt={`Gallery item ${index + 1}`}
                      className="w-full h-auto object-cover transition-transform duration-300"
                    />

                    {/* Hover overlay */}
                    <div
                      className={`absolute inset-0 bg-black bg-opacity-0 transition-all duration-300 flex items-center justify-center`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-8 grid-rows-5 gap-2">
              <div
                className={cn(
                  "col-span-2 row-span-3 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-2 col-start-3 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-3 col-start-7 row-start-1 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-2 col-start-5 row-start-1 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-2 col-start-1 row-start-4 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-2 col-start-7 row-start-4 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 row-span-2 col-start-4 row-start-3 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "row-span-3 col-start-3 row-start-3 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "row-span-3 col-start-6 row-start-3 bg-muted rounded-md",
                  isFetching && "animate-pulse"
                )}
              />
              <div
                className={cn(
                  "col-span-2 col-start-4 row-start-5 bg-muted rounded-md h-24",
                  isFetching && "animate-pulse"
                )}
              />
            </div>
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
