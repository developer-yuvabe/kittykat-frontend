"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
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
import { Loader, X } from "lucide-react";
import { useModelsStore } from "@/store/models.store";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import { RemixImageHandle } from "../../_components/remix/RemixImage";
import { AskKittykatImageSection } from "../../gallery/_components/AskKittykatImageSection";
import RemixControls from "@/components/chatbot/a2i/features/RemixControls";
import ImageUpscaler from "@/components/chatbot/a2i/features/ImageUpscaler";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConceptVisualEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConceptVisualEditor({
  open,
  onOpenChange,
}: ConceptVisualEditorProps) {
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

  // filters
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

  const galleryActions = useGalleryQuery({
    selectedFilters: isBrandsFetched ? selectedFilters : basicFilters,
  });

  useEffect(() => {
    if (!isBrandsFetched) return;

    const availableBrands = galleryActions.brandsData?.brands || [];
    const validBrandId =
      selectedBrandId ||
      (availableBrands.length > 0 ? availableBrands[0].brand_id : null);

    if (!selectedBrandId && validBrandId) {
      setSelectedBrandId(validBrandId);
    }

    const newFilters = {
      ...basicFilters,
      brands: validBrandId ? [validBrandId] : [],
    };

    setSelectedFilters(newFilters);
  }, [
    selectedBrandId,
    galleryActions.brandsData?.brands,
    isBrandsFetched,
    setSelectedBrandId,
    basicFilters,
  ]);

  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);

  // remix state
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

  const router = useRouter();
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentItem(null); // reset item on close
    }
    onOpenChange(isOpen);
    router.push("/");
  };

  const handleManualClose = () => {
    setCurrentItem(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 bg-white border-b flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Visual Editor
            </DialogTitle>
            <div className="flex items-center gap-4">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleManualClose()}
                className="p-2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 gap-x-3 p-4 min-h-0">
          {/* Left panel */}
          <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
            {activeTab === "video-gen" ? (
              !isBrandsFetched ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">Loading brands...</p>
                </div>
              ) : (
                <VideoGenerationInput
                  item={currentItem}
                  campaignId={selectedCampaignId}
                  handleDialogChange={handleDialogChange}
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

          {/* Right panel */}
          <div className="flex-1 w-[65%] flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col bg-none"
            >
              <AskKittykatTabs />

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
                    handleDialogChange={handleDialogChange}
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
                    handleDialogChange={handleDialogChange}
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
                    handleDialogChange={handleDialogChange}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConceptVisualEditor;
