import { ContentSection } from "@/components/shared/ContentSection";
import EmblaCarousel from "@/components/ui/embla-carousel";
import { Loader } from "@/components/ui/loader";
import { Loader as LoaderIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { socialLinks } from "@/lib/icons";
import { isValidUrl } from "@/lib/utils";
import { Agents, ThreadBrand } from "@/types/types";
import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Pencil } from "lucide-react";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { formatUpdateMessage } from "@/lib/langgraph.utils";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";

interface BrandMediaProps {
  brandMedia: ThreadBrand["brand_media"];
  socialMedia?: {
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

export const BrandMedia: React.FC<BrandMediaProps> = ({
  brandMedia,
  socialMedia,
}) => {
  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<string>("");
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);

  const { posts, status, message } = useMemo(() => {
    return {
      posts: brandMedia?.posts || [],
      status: brandMedia?.status || null,
      message: brandMedia?.message || "Failed to load brand media.",
    };
  }, [brandMedia]);

  const shouldShowCarousel = useMemo(
    () => status === "running" || status === "succeeded",
    [status]
  );

  const isLoading = stream.isLoading;

  React.useEffect(() => {
    if (!isLoading && savingPlatform) {
      setSavingPlatform(null);
    }
  }, [isLoading, savingPlatform]);

  if (!Object.values(socialMedia || {}).some((v) => v)) return null;

  return (
    <ContentSection
      title="Brand Media"
      content={
        <div className="relative">
          <div className="my-4">
            {status === "failed" && (
              <p className="text-sm text-destructive">{message}</p>
            )}

            {shouldShowCarousel &&
              (status === "succeeded" ? (
                <div className="flex justify-center">
                  <EmblaCarousel
                    data={posts}
                    renderItem={({ item }) => (
                      <div onClick={() => setExpandedImage(item.url)}>
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.caption}
                          className="object-cover"
                        />
                      </div>
                    )}
                    options={{ align: "center", loop: true }}
                  />
                </div>
              ) : (
                <EmblaCarousel
                  data={Array.from({ length: 10 })}
                  renderItem={() => (
                    <Skeleton className="w-full h-full flex items-center justify-center p-6 rounded-md">
                      <Loader className="fill-foreground" />
                    </Skeleton>
                  )}
                  options={{ align: "center", loop: true }}
                />
              ))}
          </div>

          {/* Editable Contact Links */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 flex-wrap">
            {socialLinks.map(({ platform, color, icon }) => {
              const currentUrl =
                socialMedia?.[platform as keyof typeof socialMedia];
              if (!currentUrl || !isValidUrl(currentUrl)) return null;

              const url = new URL(currentUrl);

              const displayText =
                platform === "instagram"
                  ? "@" + url.pathname.split("/").filter(Boolean).pop()
                  : platform === "website"
                  ? url.hostname.replace(/^www\./, "")
                  : url.pathname.split("/").filter(Boolean).pop();

              const isEditing = editingPlatform === platform;
              const isSaving = savingPlatform === platform;

              return (
                <Popover
                  key={platform}
                  open={isEditing}
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingPlatform(null);
                      setNewUrl("");
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div className="flex items-center group relative">
                      <a
                        href={currentUrl}
                        className="flex px-3 py-2 rounded-full items-center gap-2 cursor-pointer"
                        style={{ backgroundColor: color }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {icon}
                        <span>{displayText}</span>
                      </a>

                      <div className="ml-1">
                        {isSaving ? (
                          <LoaderIcon
                            size={14}
                            className="animate-spin text-gray-600"
                          />
                        ) : (
                          <TooltipIconButton
                            tooltip="Edit link"
                            onClick={() => {
                              setNewUrl(currentUrl || "");
                              setEditingPlatform(platform);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil size={14} />
                          </TooltipIconButton>
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>

                  <PopoverContent className="w-80 p-4 space-y-3" side="top">
                    <Input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder={`Enter new ${platform} URL`}
                    />
                    {!isValidUrl(newUrl) && (
                      <p className="text-sm text-red-500">Invalid URL</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingPlatform(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={!isValidUrl(newUrl)}
                        onClick={() => {
                          const msg = formatUpdateMessage(
                            `socialMedia.${platform}`,
                            currentUrl ?? "",
                            newUrl,
                            Agents.BRANDING_AGENT,
                            `${platform}`,
                            `Change ${platform} link from ${
                              currentUrl ?? ""
                            } to ${newUrl}`
                          );

                          if (msg) {
                            setSavingPlatform(platform);
                            setEditingPlatform(null); // Close popover immediately
                            submitOptimisticMessage({
                              stream,
                              text: msg,
                              currentBrandContextId: selectedBrandId,
                              userId: user!.id,
                            });
                          }
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>

          {/* Expanded Image Modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <img
                src={expandedImage}
                alt="Expanded media"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </div>
          )}
        </div>
      }
      context={{
        agentId: Agents.BRANDING_AGENT,
        data: {
          socialMedia,
        },
      }}
    />
  );
};
