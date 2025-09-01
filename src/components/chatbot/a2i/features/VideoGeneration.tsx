import { useBrandStore } from "@/store/brand.store";
import { useVideoGenStore } from "@/store/video-gen.store";

type VideoGenerationOnProps = {
  baseImage: string;
  closeDialog: () => void;
  campaignId?: string | null;
};

const VideoGeneration = ({}: VideoGenerationOnProps) => {
  const { selectedBrandId } = useBrandStore();
  const { generationIds } = useVideoGenStore();

  return (
    <div className="w-full h-full flex-1 space-y-4">
      <div className="w-full h-full border flex-[0.7]"></div>

      <div className="w-full h-full border flex-[0.3]"></div>
    </div>
  );
};

export default VideoGeneration;
