import { AskKittykatTabs } from "@/app/(main)/gallery/_components/AskKittykatTabs";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useModelsStore } from "@/store/models.store";
import { ConceptVisualTabs } from "@/types/concept-visual-editor.types";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandSelector from "../chatbot/brands/BrandSelector";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent } from "../ui/tabs";
import RefreshAsset from "./RefreshAsset";
import AskKittyKatTabContent from "./TabsContent/AskKittyKatTabContent";
import ImageUpcalerTabContent from "./TabsContent/ImageUpcalerTabContent";
import VideoGenerationTabContent from "./TabsContent/VideoGenerationTabContent";
import VirtualTryOnTabContent from "./TabsContent/VirtualTryOnTabContent";
import { RemixCanvasProvider } from "@/contexts/RemixCanvasContext";
import RemixTabContent from "./TabsContent/RemixTabContent";
import AskKittykatVersions from "@/app/(main)/gallery/_components/AskKittykatVersions";
import { GalleryItemResponse } from "@/types/gallery.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import VideoGenerationInput from "../chatbot/a2i/features/VideoGenerationInput";
import { AskKittykatImageSection } from "@/app/(main)/gallery/_components/AskKittykatImageSection";

/**
    @description A visual editor for creating and editing concept visual media. The UI adapts based on the source prop
*/
const ConceptVisualEditor = () => {
  const {
    isConceptVisualOpened,
    closeConceptVisual,
    source,
    currentAsset,
    setCurrentAsset,
    assetItems,
    galleryActions,
    defaultActiveTab,
  } = useConceptVisualStore();
  const { isModelsFetched } = useModelsStore();
  const { isBrandsFetched, selectedBrandId } = useBrandStore();
  const [currentAssetVersion, setCurrentAssetVersion] = useState(currentAsset);
  const [currentTab, setCurrentTab] = useState<ConceptVisualTabs>(
    defaultActiveTab ?? (source === "blanket" ? "vton" : "ask-kittykat")
  );

  const queryClient = useQueryClient();
  const versionsRef = useRef<HTMLDivElement>(null);
  const versions = useQuery({
    queryKey: ["versions", currentAsset?.id],
    queryFn: () => galleryService.getGalleryItemVersions(currentAsset!.id),
    enabled: !!currentAsset?.id,
    staleTime: Infinity,
  });

  const revalidateGalleryItemVersions = async (data: GalleryItemResponse) => {
    if (currentAsset?.id) {
      // Update the versions cache for any version that matches
      queryClient.setQueryData(
        ["versions", currentAsset.id],
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((version: GalleryItemResponse) =>
            version.id === data.id ? data : version
          );
        }
      );

      if (data.id === currentAsset.id) {
        queryClient.setQueryData(["gallery-item", currentAsset.id], data);
      }

      setCurrentAssetVersion((prev) => {
        if (!prev || prev.id !== data.id) {
          return prev; // Don't update if it's not the current version
        }
        return data; // Update if it's the current version
      });
    }
  };

  const handleNavigateAssetItems = (direction: "next" | "prev") => {
    const currentIndex = assetItems.findIndex((a) => a.id === currentAsset?.id);

    if (direction === "prev" && currentIndex > 0) {
      setCurrentAsset(assetItems[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < assetItems.length - 1) {
      setCurrentAsset(assetItems[currentIndex + 1]);
    }
  };

  useEffect(() => {
    setCurrentAssetVersion(currentAsset);
  }, [currentAsset]);

  useEffect(() => {
    if (versions.data && versions.data.length > 1) {
      // Always set to the latest version when versions change
      setCurrentAssetVersion(versions.data[versions.data.length - 1]);
    }
  }, [versions.data]);

  return (
    <Dialog
      open={isConceptVisualOpened}
      onOpenChange={(isOpened) => {
        if (!isOpened) {
          closeConceptVisual();
        }
      }}
    >
      <DialogContent
        className="p-0 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <RemixCanvasProvider>
          <DialogHeader className="px-6 py-4 bg-white border-b flex-shrink-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                Concept Visual Editor
              </DialogTitle>
              <div className="flex items-center gap-4">
                {source === "blanket" && (
                  <BrandSelector
                    showCampaigns
                    showSelectedValue
                    modal
                    className="bg-background w-80"
                  />
                )}

                {assetItems.length > 1 && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigateAssetItems("prev")}
                      disabled={
                        assetItems.findIndex(
                          (a) => a.id === currentAsset?.id
                        ) <= 0
                      }
                      className="p-2 h-8 w-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigateAssetItems("next")}
                      disabled={
                        assetItems.findIndex(
                          (a) => a.id === currentAsset?.id
                        ) >=
                        assetItems.length - 1
                      }
                      className="p-2 h-8 w-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {source !== "blanket" && currentAsset && galleryActions && (
                  <RefreshAsset
                    currentAssetVersion={currentAssetVersion!}
                    currentAsset={currentAsset}
                    galleryActions={galleryActions}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => closeConceptVisual()}
                  className="p-2 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 gap-x-3 p-4 min-h-0">
            {/* Loading State until brands and models are fetched */}
            {!isBrandsFetched || !isModelsFetched ? (
              <>
                <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
                  <Skeleton className="w-full h-full flex-1" />
                </div>
                <div className="flex-1 w-[65%] flex flex-col min-h-0 gap-y-6">
                  <div className="flex gap-x-2 h-24">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Skeleton key={idx} className="flex-1 h-full" />
                    ))}
                  </div>
                  <Skeleton className="flex-1 h-full w-full" />
                </div>
              </>
            ) : !selectedBrandId ? (
              <>
                <div className="flex h-[85vh] flex-col items-center justify-center text-center space-y-4 px-4 w-full">
                  <h2 className="text-xl font-semibold text-gray-800">
                    No brand selected
                  </h2>
                  <p className="text-gray-600 max-w-md">
                    You haven&apos;t selected a brand yet. Please choose a brand
                    to continue and start creating amazing concept visuals!
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Left Side */}
                <div className="w-[35%] min-w-[280px] flex flex-col gap-y-4">
                  {versions.isFetching ? (
                    <div className="relative w-full h-full flex items-center justify-center animate-pulse">
                      <div className="bg-gray-200 rounded-lg w-full max-w-4xlh-20 sm:h-[16rem] md:h-[24rem] lg:h-[36rem] xl:h-[40rem]" />
                    </div>
                  ) : currentTab === "video-generation" ? (
                    <VideoGenerationInput item={currentAssetVersion} />
                  ) : (
                    <AskKittykatImageSection
                      item={currentAssetVersion}
                      galleryActions={galleryActions!}
                      revalidateGalleryItemVersions={
                        revalidateGalleryItemVersions
                      }
                      setCurrentItem={setCurrentAssetVersion}
                      currentTab={currentTab}
                    />
                  )}

                  {source != "blanket" && currentAsset && (
                    <AskKittykatVersions
                      item={currentAsset}
                      currentVersion={currentAssetVersion}
                      onVersionChange={(updatedItem) => {
                        // If switching to Version 1 (base item), get the latest data from cache
                        const cachedItem = queryClient.getQueryData([
                          "gallery-item",
                          currentAsset.id,
                        ]) as GalleryItemResponse | undefined;
                        setCurrentAssetVersion(cachedItem || updatedItem);
                      }}
                      ref={versionsRef}
                      versions={versions}
                    />
                  )}
                </div>

                {/* Right Side */}
                <div className="flex-1 w-[65%] flex flex-col min-h-0 gap-y-6">
                  <Tabs
                    value={currentTab}
                    onValueChange={(v) => setCurrentTab(v as ConceptVisualTabs)}
                    className="flex-1 flex flex-col bg-none"
                  >
                    <AskKittykatTabs />

                    {/* Tabs Content */}

                    <TabsContent
                      value={"vton" satisfies ConceptVisualTabs}
                      className="flex-1 h-full"
                    >
                      <VirtualTryOnTabContent
                        currentAssetVersion={currentAssetVersion}
                      />
                    </TabsContent>

                    <TabsContent
                      value={"remix" satisfies ConceptVisualTabs}
                      className="flex-1 h-full"
                    >
                      <RemixTabContent
                        currentAssetVersion={currentAssetVersion}
                      />
                    </TabsContent>

                    <TabsContent
                      value={"video-generation" satisfies ConceptVisualTabs}
                      className="flex-1 h-full"
                    >
                      <VideoGenerationTabContent
                        versionsRef={versionsRef}
                        currentAssetVersion={currentAssetVersion}
                      />
                    </TabsContent>

                    <TabsContent
                      value={"upscaler" satisfies ConceptVisualTabs}
                      className="flex-1 h-full"
                    >
                      <ImageUpcalerTabContent
                        currentAssetVersion={currentAssetVersion}
                      />
                    </TabsContent>

                    <TabsContent
                      value={"ask-kittykat" satisfies ConceptVisualTabs}
                      className="flex-1 flex flex-col min-h-0"
                      key={currentAssetVersion?.id} // Force remount on version change
                    >
                      {currentAssetVersion && (
                        <AskKittyKatTabContent
                          currentAssetVersion={currentAssetVersion}
                          setCurrentAssetVersion={setCurrentAssetVersion}
                          galleryActions={galleryActions!}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </RemixCanvasProvider>
      </DialogContent>
    </Dialog>
  );
};
export default ConceptVisualEditor;
