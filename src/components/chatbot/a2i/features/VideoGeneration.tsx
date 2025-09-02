import { cn } from "@/lib/utils";
import { useVideoGenStore } from "@/store/video-gen.store";
import { A2iImageGeneration } from "@/types/types";
import { Video } from "lucide-react";
import { useMemo, useState } from "react";

type VideoGenerationOnProps = {
  baseImage: string;
  closeDialog: () => void;
  campaignId?: string | null;
};

const VideoGeneration = ({}: VideoGenerationOnProps) => {
  const [currentVideoItem, setCurrentVideoItem] =
    useState<A2iImageGeneration["video"]>();
  const { currentSessionGenerationIds, generations } = useVideoGenStore();

  const currentSessionGenerations = useMemo(() => {
    return generations.filter((gen) => gen.type === "video");
  }, [currentSessionGenerationIds, generations]);

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-hidden">
      {/* First section: video preview (flex-1 fills available height) */}
      <div className="flex-1 flex">
        <div
          className={cn("w-full", {
            "flex items-center justify-center bg-accent border border-dashed":
              !currentVideoItem,
          })}
        >
          {currentVideoItem ? (
            <video
              src={currentVideoItem.url}
              className="w-full h-full object-contain"
              controls
            />
          ) : (
            <div className="flex flex-col items-center gap-y-2">
              <Video />
              <p className="text-sm text-muted-foreground">
                Video preview will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Second section: horizontal scroll thumbnails */}
      <div className="w-full">
        <div className="w-full overflow-x-auto flex items-center gap-x-2">
          {currentSessionGenerations.map((gen) => (
            <div key={gen.id} className="h-32 w-32 cursor-pointer shrink-0">
              {gen.status === "completed" && gen.video ? (
                <video
                  src={gen.video.url}
                  className="w-32 h-32 object-cover"
                  onClick={() => {
                    if (currentVideoItem?.url === gen.video?.url) {
                      setCurrentVideoItem(undefined);
                    } else {
                      setCurrentVideoItem(gen.video);
                    }
                  }}
                />
              ) : gen.status === "failed" ? (
                <div className="w-32 h-32 flex items-center justify-center bg-red-200">
                  <span className="text-red-500">Generation Failed</span>
                </div>
              ) : gen.status === "processing" ? (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500">Processing...</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
