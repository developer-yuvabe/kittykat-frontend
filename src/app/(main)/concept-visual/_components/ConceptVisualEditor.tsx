"use client";

import React, { useMemo, useRef, useState } from "react";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { useQueryState } from "nuqs";
import { useBrandStore } from "@/store/brand.store";
import { MediaUploadBrandSelector } from "../../gallery/_components/MediaUploadBrandSelector";
import { useGalleryQuery } from "@/hooks/useGallery";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AskKittykatTabs } from "../../gallery/_components/AskKittykatTabs";
import VideoGeneration from "@/components/chatbot/a2i/features/VideoGeneration";
import VideoGenerationInput from "@/components/chatbot/a2i/features/VideoGenerationInput";
import VirtualTryOn from "@/components/chatbot/a2i/features/VirtualTryOn";
import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { SelectIcon } from "@/components/ui/custom-icon";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useModelsStore } from "@/store/models.store";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import { RemixImageHandle } from "../../_components/remix/RemixImage";
import { AskKittykatImageSection } from "../../gallery/_components/AskKittykatImageSection";
import RemixControls from "@/components/chatbot/a2i/features/RemixControls";
import ImageUpscaler from "@/components/chatbot/a2i/features/ImageUpscaler";

type ConceptVisualEditorProps = {
  filters?: EnhancedSelectedFilters;
  brandId?: string;
  campaignId?: string;
};

export function ConceptVisualEditor({
  filters,
  campaignId,
  brandId,
}: ConceptVisualEditorProps) {
  const [activeTab, setActiveTab] = useState("virtual-tryon");
  const { selectedRemixModel } = useModelsStore();
  //   const [currentItem, setCurrentItem] = useState<
  //     GalleryItemResponse | undefined
  //   >(undefined);
  const [currentItem, setCurrentItem] = useState<GalleryItemResponse | null>(
    null
  );
  console.log("Current Item:", currentItem);

  const versionsRef = useRef<HTMLDivElement>(null);
  const { selectedBrandId } = useBrandStore();
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId);
  const initialFilters = useMemo(() => {
    return (
      filters ?? {
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
      }
    );
  }, [filters]);
  const [selectedFilters, setSelectedFilters] =
    useState<EnhancedSelectedFilters>(initialFilters);
  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);
  const [initialBrandId, setInitialBrandId] = useQueryState<string | undefined>(
    "brandId",
    {
      defaultValue: undefined,
      parse: (value) => (value ? value : undefined),
      serialize: (value) => value || "",
      history: "push",
    }
  );
  const [initialWorkflowStatus, setInitialWorkflowStatus] = useQueryState<
    string[]
  >("status", {
    defaultValue: [],
    parse: (value) => (value ? value.split(",") : []),
    serialize: (value) => value.join(","),
    history: "push",
  });
  const effectiveBrandId = useMemo(() => {
    return initialBrandId || selectedBrandId;
  }, [initialBrandId, selectedBrandId]);
  const galleryActions = useGalleryQuery({
    selectedFilters,
  });
  // const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  // const { selectedRemixModel, selectedVtonModel } = useModelsStore();

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
      <div className="flex items-center justify-between bg-white border-t-2 border-b-2 border-gray-200 left-0 right-0 px-6 py-4 z-50">
        <h2 className="text-2xl font-semibold">Concept Visual Editor</h2>
        <MediaUploadBrandSelector
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          brands={galleryActions.brandsData?.brands || []}
          brandsLoading={galleryActions.brandsLoading}
          setSelectedCampaignId={setSelectedCampaignId}
          selectedCampaignId={selectedCampaignId}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          preSelectedBrandId={brandId || effectiveBrandId}
          setInitialWorkflowStatus={setInitialWorkflowStatus}
          setInitialBrandId={setInitialBrandId}
        />
      </div>
      <div className="flex-1 min-h-0">
        {/* Main content wrapper must fill viewport height minus header */}
        <div className="flex h-[calc(100vh-72px)] gap-x-3 p-4">
          {/* Left Panel */}

          <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
            {activeTab === "video-gen" ? (
              <VideoGenerationInput
                item={currentItem}
                campaignId={campaignId}
              />
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
              className="flex-1 flex flex-col min-h-0"
            >
              <AskKittykatTabs />

              <TabsContent
                value="video-gen"
                className="flex-1 flex flex-col min-h-0"
              >
                <VideoGeneration heightRef={versionsRef} />
              </TabsContent>
              <TabsContent value="virtual-tryon">
                <VirtualTryOn
                  modelImage={currentItem?.asset_url}
                  source="media-gallery"
                  //   campaignId={remixControls.campaignId}
                />
              </TabsContent>
              <TabsContent value="in-paint">
                {}
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
                  campaignId={campaignId}
                />
              </TabsContent>
              <TabsContent value="upscaler">
                <ImageUpscaler
                  brandId={selectedBrandId!}
                  source="media-gallery"
                  initialImage={currentItem?.asset_url || ""}
                  campaignId={campaignId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConceptVisualEditor;
