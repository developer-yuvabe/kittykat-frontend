"use client";

import React, { useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { NotificationIcon } from "../ui/custom-icon";
import { ICON_SIZE } from "../shared/NavLinks";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getUserNotifications } from "@/services/api/notification.service";
import { Loader2 } from "lucide-react";
import NotificationItem from "./NotificationItem";

const NotificationHoverCard = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["user-notifications"],
    queryFn: getUserNotifications,
    staleTime: 5 * 60 * 1000,
  });

  const totalUnreadCount = useMemo(() => {
    return (
      notifications?.reduce((acc, group) => {
        return acc + (group.unread_count || 0);
      }, 0) || 0
    );
  }, [notifications]);

  return (
    <HoverCard openDelay={0}>
      <HoverCardTrigger>
        <div
          className={cn(
            `flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787] hover:text-primary relative`
          )}
        >
          <NotificationIcon
            className="text-[#6e7787] cursor-pointer hover:text-primary"
            size={ICON_SIZE}
          />
          <span>Notifications</span>
          {isLoading && (
            <div className="bg-white  absolute right-5 z-10 bottom-4 ">
              <Loader2 className="text-primary animate-spin w-4 h-4 " />
            </div>
          )}
          {notifications &&
            notifications.length > 0 &&
            totalUnreadCount > 0 && (
              <div className="bg-red-500  absolute right-4 z-10 bottom-4 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-white text-xs ">
                  {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                </span>
              </div>
            )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="min-w-2xl p-0 overflow-y-auto scrollbar max-h-[400px]">
        {isLoading ? (
          <div className="text-center text-gray-500 italic text-sm py-4">
            Loading notifications...
          </div>
        ) : notifications && notifications.length != 0 ? (
          <div>
            {notifications.map((group) => (
              <NotificationItem key={group.brand_id} notification={group} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 italic text-sm py-4">
            No notifications
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default NotificationHoverCard;
