import RemixControls from "@/components/chatbot/a2i/features/RemixControls";
import { useRemixCanvas } from "@/contexts/RemixCanvasContext";
import { useModelsStore } from "@/store/models.store";
import { GalleryItemResponse } from "@/types/gallery.types";

type RemixTabContentProps = {
  currentAssetVersion: GalleryItemResponse | null;
};

const RemixTabContent = ({ currentAssetVersion }: RemixTabContentProps) => {
  const {
    brushSize,
    setBrushSize,
    remixImageRef,
    remixHistory,
    offScreenCanvasRef,
  } = useRemixCanvas();
  const { selectedRemixModel } = useModelsStore();

  const isRemixEnabled =
    !!selectedRemixModel && selectedRemixModel.provider === "openai";

  const handleUndo = () => {
    if (remixImageRef.current?.undo) {
      remixImageRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (remixImageRef.current?.redo) {
      remixImageRef.current.redo();
    }
  };

  const handleClear = () => {
    if (remixImageRef.current?.clearCanvas) {
      remixImageRef.current.clearCanvas();
    }
  };
  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (remixImageRef.current?.setBrushSize && isRemixEnabled) {
      remixImageRef.current.setBrushSize(size);
    }
  };

  return (
    <RemixControls
      image={{
        url: currentAssetVersion?.asset_url || "",
        size: currentAssetVersion?.size || "unknown",
      }}
      brushSize={brushSize}
      canRedo={remixHistory.canRedo}
      canUndo={remixHistory.canUndo}
      offScreenCanvasRef={offScreenCanvasRef}
      onBrushSizeChange={handleBrushSizeChange}
      onClear={handleClear}
      onRedo={handleRedo}
      onUndo={handleUndo}
      brandId={currentAssetVersion?.brand_id}
    />
  );
};

export default RemixTabContent;
