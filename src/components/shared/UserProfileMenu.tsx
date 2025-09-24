import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/store/user.store";
import { CreditCard, LifeBuoy, LogOut } from "lucide-react";
import { CreditIcon } from "../ui/custom-icon";
import QueueProgress from "./QueueProgress";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/config/firebase.config";
import { useCreditsStore } from "@/store/credits.store";

export function UserProfileMenu({}) {
  const { user, credits } = useUserStore();
  const router = useRouter();
  const { setShowPurchaseCreditsModal } = useCreditsStore();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/logout");
    // reload the page to ensure the user is logged out
    window.location.reload();
    router.push("/login");
  }

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-6">
      <div className="hidden sm:block">
        <QueueProgress />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center rounded-full bg-primary/20 cursor-pointer">
          <Avatar className="h-10 w-10 rounded-l-full">
            <AvatarImage alt={user?.name || "User"} />
            <AvatarFallback className="bg-purple-100 text-purple-600">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {credits !== null && (
            <div className="flex items-center gap-2  text-primary px-3 py-2 rounded-full h-10">
              <span className="text-xs">{credits}</span>
              <CreditIcon className="w-2 h-2" />
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage alt={user?.name} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user!.name}</span>
                <span className="truncate text-xs">{user!.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowPurchaseCreditsModal(true)}>
            <CreditCard />
            Purchase Credits
          </DropdownMenuItem>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={"/help"}>
                <LifeBuoy />
                Help
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
