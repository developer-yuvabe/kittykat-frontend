import { BrandNotificationGroup } from "@/types/notification.types";
import React from "react";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { cn, formatToLocalTime } from "@/lib/utils";
import { markNotificationsAsRead } from "@/services/api/notification.service";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandStore } from "@/store/brand.store";

const NotificationItem = ({
  notification,
  setOpen,
}: {
  notification: BrandNotificationGroup;
  setOpen: () => void;
}) => {
  const router = useRouter();
  const { setSelectedCampaignId } = useBrandStore();
  const [showAssets, setShowAssets] = React.useState(false);
  const queryClient = useQueryClient();

  const handleNotificationClick = async (galleryItemId: string) => {
    setSelectedCampaignId(null);

    // Make sure the campaignId is reset before navigation
    setTimeout(() => {
      router.replace(`/gallery?id=${galleryItemId}`);
    }, 100);

    setOpen();
    await markNotificationsAsRead(notification.brand_id);
    queryClient.invalidateQueries({
      queryKey: ["user-notifications"],
    });
  };

  return (
    <div className="border-b last:border-b-0 py-2">
      <div
        className="flex items-center justify-between cursor-pointer px-4"
        onClick={() => setShowAssets(!showAssets)}
      >
        <p className="text-base mb-2">{notification.message}</p>
        <Button
          size={"icon"}
          variant={"ghost"}
          className="rounded-full shrink-0"
          onClick={() => setShowAssets(!showAssets)}
        >
          {!showAssets ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>

      {showAssets && (
        <AnimatePresence>
          <ul>
            {notification.assets.map((asset) => {
              const status = WORKFLOW_STATUS_OPTIONS.find(
                (option) => option.value === asset.status
              );
              return (
                <li
                  onClick={() => handleNotificationClick(asset.gallery_item_id)}
                  key={asset.gallery_item_id}
                  className={cn(
                    `flex items-center justify-between p-2 cursor-pointer hover:bg-muted px-4`,
                    {
                      "bg-muted": !asset.is_read,
                    }
                  )}
                >
                  <div className="flex items-center gap-x-2">
                    {asset.image_url && (
                      <img
                        src={asset.image_url}
                        alt="Asset"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    {asset.video_url && (
                      <video
                        src={asset.video_url}
                        autoPlay
                        muted
                        loop
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      {status && (
                        <Badge
                          className={`text-sm font-medium text-white ${status.dotColor}`}
                        >
                          {status.label}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(
                          formatToLocalTime(asset.updated_at)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </AnimatePresence>
      )}
    </div>
  );
};

export default NotificationItem;
