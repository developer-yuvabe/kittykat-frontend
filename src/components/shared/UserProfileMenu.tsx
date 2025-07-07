import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";
import { useUserStore } from "@/store/user.store";
import { Separator } from "../ui/separator";
import { LogoutButton } from "./LogoutButton";
import QueueProgress from "./QueueProgress";

export function UserProfileMenu({}) {
  const { user } = useUserStore();

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
      <div className="hidden sm:block">
        <QueueProgress />
      </div>

      {/* User Profile with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage alt={user?.name || "User"} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 overflow-hidden" align="end">
          {/* User Info Section */}
          <div className="p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage alt={user?.name || "User"} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "No email provided"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Mobile Queue Progress - Only visible on mobile */}
          <div className="sm:hidden p-4">
            <QueueProgress />
          </div>

          <Separator className="sm:hidden" />

          <LogoutButton />
        </PopoverContent>
      </Popover>
    </div>
  );
}
