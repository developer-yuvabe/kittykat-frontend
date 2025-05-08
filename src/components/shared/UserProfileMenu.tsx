import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCircle,
  Settings,
  CreditCard,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { LogoutButton } from "./LogoutButton";

export function UserProfileMenu() {
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
    <div className="flex items-center space-x-6">
      <div className="w-10 h-10 rounded-full bg-gray-100 text-[#565E6C] flex items-center justify-center text-xl font-medium">
        ?
      </div>

      {/* User Profile with Popover using shadcn components */}
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
        <PopoverContent className="w-72 p-0" align="end">
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
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "No email provided"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Menu Items */}
          <div className="p-2">
            <Link href="#">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm h-9"
              >
                <UserCircle size={16} className="text-gray-500" />
                <span>Profile</span>
              </Button>
            </Link>
            <Link href="#">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm h-9"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Settings</span>
              </Button>
            </Link>
            <Link href="#">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm h-9"
              >
                <CreditCard size={16} className="text-gray-500" />
                <span>Billing</span>
              </Button>
            </Link>
            <Link href="#">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm h-9"
              >
                <LifeBuoy size={16} className="text-gray-500" />
                <span>Support</span>
              </Button>
            </Link>
          </div>

          <Separator />

          <LogoutButton />
        </PopoverContent>
      </Popover>
    </div>
  );
}
