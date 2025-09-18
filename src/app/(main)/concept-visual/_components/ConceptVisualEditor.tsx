"use client";

import React, { useMemo, useRef, useState } from "react";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";
import { MediaUploadBrandSelector } from "../../gallery/_components/MediaUploadBrandSelector";
import { useGalleryQuery } from "@/hooks/useGallery";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AskKittykatTabs } from "../../gallery/_components/AskKittykatTabs";
import VideoGeneration from "@/components/chatbot/a2i/features/VideoGeneration";
import VideoGenerationInput from "@/components/chatbot/a2i/features/VideoGenerationInput";
import VirtualTryOn from "@/components/chatbot/a2i/features/VirtualTryOn";
import { Loader } from "lucide-react";
import { useModelsStore } from "@/store/models.store";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import { RemixImageHandle } from "../../_components/remix/RemixImage";
import { AskKittykatImageSection } from "../../gallery/_components/AskKittykatImageSection";
import RemixControls from "@/components/chatbot/a2i/features/RemixControls";
import ImageUpscaler from "@/components/chatbot/a2i/features/ImageUpscaler";

export function ConceptVisualEditor() {
  const [activeTab, setActiveTab] = useState("virtual-tryon");
  const { selectedRemixModel, isModelsFetched } = useModelsStore();
  const [currentItem, setCurrentItem] = useState<GalleryItemResponse | null>(
    null
  );
  const versionsRef = useRef<HTMLDivElement>(null);
  const { selectedBrandId, isBrandsFetched, setSelectedBrandId } =
    useBrandStore();

  const [selectedCampaignId, setSelectedCampaignId] = useState<
    string | undefined
  >(undefined);

  // Create basic filters for gallery query first
  const basicFilters = useMemo(
    () => ({
      brands: [],
      campaigns: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
      has_product: undefined,
      has_people: undefined,
      has_lifestyle_context: undefined,
      is_favourite: undefined,
      is_archived: undefined,
      moodboards: [],
    }),
    []
  );

  const [selectedFilters, setSelectedFilters] =
    useState<EnhancedSelectedFilters>(basicFilters);

  // Only create galleryActions when brands are fetched
  const galleryActions = useGalleryQuery({
    selectedFilters: isBrandsFetched ? selectedFilters : basicFilters,
  });

  // Update selectedFilters when brands are loaded or when props change
  React.useEffect(() => {
    if (!isBrandsFetched) return;

    const availableBrands = galleryActions.brandsData?.brands || [];
    const validBrandId =
      selectedBrandId ||
      (availableBrands.length > 0 ? availableBrands[0].brand_id : null);

    // Auto-select the first brand if none is selected and brands are available
    if (!selectedBrandId && validBrandId) {
      setSelectedBrandId(validBrandId);
    }

    const newFilters = {
      brands: validBrandId ? [validBrandId] : [],
      campaigns: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
      has_product: undefined,
      has_people: undefined,
      has_lifestyle_context: undefined,
      is_favourite: undefined,
      is_archived: undefined,
      moodboards: [],
    };

    setSelectedFilters(newFilters);
  }, [
    selectedBrandId,
    galleryActions.brandsData?.brands,
    isBrandsFetched,
    setSelectedBrandId,
  ]);

  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);

  const [brushSize, setBrushSize] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  const isRemixEnabled =
    activeTab === "in-paint" &&
    !!selectedRemixModel &&
    selectedRemixModel.provider === "openai";

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
    <div className=" w-full border-b border-gray-200">
      {/* Header */}

      <div className="flex-1 min-h-0">
        {/* Main content wrapper must fill viewport height minus header */}
        <div className="flex h-[calc(100vh-100px)] gap-x-3 p-4">
          {/* Left Panel */}

          <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
            <MediaUploadBrandSelector
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              brands={galleryActions.brandsData?.brands || []}
              brandsLoading={galleryActions.brandsLoading}
              setSelectedCampaignId={setSelectedCampaignId}
              selectedCampaignId={selectedCampaignId}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              preSelectedBrandId={selectedBrandId}
              setInitialWorkflowStatus={async () => new URLSearchParams()}
              setInitialBrandId={async () => new URLSearchParams()}
            />
            {activeTab === "video-gen" ? (
              !isBrandsFetched ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Loading brands...</p>
                </div>
              ) : (
                <VideoGenerationInput
                  item={currentItem}
                  campaignId={selectedCampaignId}
                />
              )
            ) : !isBrandsFetched ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground">Loading brands...</p>
              </div>
            ) : (
              <AskKittykatImageSection
                item={currentItem}
                galleryActions={galleryActions}
                isRemixEnabled={isRemixEnabled}
                imageRef={imageRef}
                canvasRef={canvasRef}
                offScreenCanvasRef={offScreenCanvasRef}
                remixHistory={remixHistory}
                brushSize={brushSize}
                remixImageRef={remixImageRef}
                setCurrentItem={setCurrentItem}
                conceptVisualMedia={true}
              />
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 w-[65%] flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col bg-none"
            >
              <AskKittykatTabs isConceptVisualEditor={true} />

              <TabsContent value="video-gen">
                {!isModelsFetched ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader className="animate-spin" size={48} />
                  </div>
                ) : (
                  <VideoGeneration heightRef={versionsRef} />
                )}
              </TabsContent>
              <TabsContent value="virtual-tryon">
                {!isModelsFetched ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader className="animate-spin" size={48} />
                  </div>
                ) : (
                  <VirtualTryOn
                    modelImage={currentItem?.asset_url}
                    source="media-gallery"
                    campaignId={selectedCampaignId}
                  />
                )}
              </TabsContent>
              <TabsContent value="in-paint">
                {!isModelsFetched ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader className="animate-spin" size={48} />
                  </div>
                ) : (
                  <RemixControls
                    image={{
                      url: currentItem?.asset_url || "",
                      size: currentItem?.size ?? "unknown",
                    }}
                    brushSize={brushSize}
                    canRedo={remixHistory.canRedo}
                    canUndo={remixHistory.canUndo}
                    offScreenCanvasRef={offScreenCanvasRef}
                    onBrushSizeChange={handleBrushSizeChange}
                    onClear={handleClear}
                    onRedo={handleRedo}
                    onUndo={handleUndo}
                    brandId={currentItem?.brand_id}
                    source="media-gallery"
                    campaignId={selectedCampaignId}
                  />
                )}
              </TabsContent>
              <TabsContent value="upscaler">
                {!isModelsFetched ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader className="animate-spin" size={48} />
                  </div>
                ) : !isBrandsFetched ? (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Loading brands...</p>
                  </div>
                ) : (
                  <ImageUpscaler
                    brandId={selectedBrandId!}
                    source="media-gallery"
                    initialImage={currentItem?.asset_url || ""}
                    campaignId={selectedCampaignId}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptVisualEditor;
