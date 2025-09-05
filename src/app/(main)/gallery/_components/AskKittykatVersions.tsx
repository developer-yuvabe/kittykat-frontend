import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GalleryItemResponse } from "@/types/gallery.types";
import { UseQueryResult } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import AddVersion from "./AddVersion";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { RefObject, useEffect, useState } from "react";

type VersionState = {
  itemId: string;
  hasInitialized: boolean;
};

type AskKittykatVersionsProps = {
  item: GalleryItemResponse;
  currentVersion: GalleryItemResponse | null;
  onVersionChange: (item: GalleryItemResponse) => void;
  ref: RefObject<HTMLDivElement | null>;
  versions?: UseQueryResult<GalleryItemResponse[], Error>;
};

const AskKittykatVersions = ({
  item,
  currentVersion,
  onVersionChange,
  ref,
  versions,
}: AskKittykatVersionsProps) => {
  const { user } = useUserStore();
  const [versionState, setVersionState] = useState<VersionState>({
    itemId: item.id,
    hasInitialized: false,
  });

  useEffect(() => {
    // Reset state when item changes
    if (versionState.itemId !== item.id) {
      setVersionState({
        itemId: item.id,
        hasInitialized: false,
      });
      return;
    }

    // Initialize with latest version when data loads
    if (
      versions?.data?.length &&
      !versionState.hasInitialized &&
      !versions.isFetching
    ) {
      const latestVersion = versions.data[versions.data.length - 1];
      onVersionChange(latestVersion);
      setVersionState((prev) => ({ ...prev, hasInitialized: true }));
      return;
    }

    // Update current version with fresh data (preserving user selection)
    if (
      versions?.data?.length &&
      versionState.hasInitialized &&
      currentVersion
    ) {
      const updatedVersion =
        versions.data.find((v) => v.id === currentVersion.id) ||
        versions.data.find((v) => v.id === item.id); // fallback to original item

      if (updatedVersion && updatedVersion.id === currentVersion.id) {
        onVersionChange(updatedVersion);
      }
    }
  }, [
    versions?.data,
    versions?.isFetching,
    versionState,
    currentVersion?.id,
    item.id,
    onVersionChange,
  ]);

  return (
    <div ref={ref} className="flex-shrink-0 flex flex-col py-2">
      {versions?.isFetching ? (
        <div className="flex items-center gap-x-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-max border border-primary bg-muted"
          >
            Version 1
          </Button>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-8 w-20 bg-gray-300 animate-pulse rounded"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-x-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (item.id === currentVersion?.id) return;
              onVersionChange(item);
            }}
            className={cn("h-max", {
              "border border-primary bg-muted": currentVersion?.id === item.id,
            })}
          >
            Version 1
          </Button>
          {versions?.data?.map((version, idx) => (
            <Button
              key={version.id}
              variant="ghost"
              size="sm"
              className={cn("h-max", {
                "border border-primary bg-muted":
                  currentVersion?.id === version.id,
              })}
              onClick={() => onVersionChange(version)}
            >
              Version {idx + 2}
            </Button>
          ))}
          {user?.role.id === UserRoleId.ADMIN && (
            <AddVersion
              item={item}
              onVersionChange={onVersionChange}
              refetchVersions={() => versions?.refetch?.() ?? Promise.resolve()}
              versionsCount={(versions?.data?.length ?? 0) + 1}
            >
              <Button size="sm" variant={"ghost"} className="flex-1">
                <Plus className="w-6 h-6" />
              </Button>
            </AddVersion>
          )}
        </div>
      )}
    </div>
  );
};

export default AskKittykatVersions;
