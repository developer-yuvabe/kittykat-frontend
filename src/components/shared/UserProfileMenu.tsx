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
import { GemIcon, LifeBuoy, LogOut, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditIcon } from "../ui/custom-icon";
import QueueProgress from "./QueueProgress";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/config/firebase.config";
import { useTeams } from "@/hooks/useTeams";
import useUsers from "@/hooks/useUsers";
import { useEffect } from "react";

export function UserProfileMenu({}) {
  const { user, credits, kittykatExpertCredits } = useUserStore();
  const { myTeamsQuery } = useTeams();

  useEffect(() => {
    console.log(myTeamsQuery.data);
  }, [myTeamsQuery.data]);

  const { updateActiveTeam } = useUsers();
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

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
      {kittykatExpertCredits !== null && (
        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-2 rounded-full h-10 cursor-pointer">
          <span className="text-xs">
            {kittykatExpertCredits.toLocaleString()}
          </span>
          <GemIcon className="w-6 h-4" />
        </div>
      )}
      {credits !== null && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full h-10 cursor-pointer">
          <span className="text-xs">{credits.toLocaleString()}</span>
          <CreditIcon className="w-2 h-2" />
        </div>
      )}
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
          <div className="px-1 py-2">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Workspaces
            </div>

            {/* Team workspaces only - Individual workspace removed: always use team flow */}

            {/* Teams list */}
            <div className="mt-2 space-y-1">
              {myTeamsQuery.isLoading && (
                <>
                  {/* Render a few skeleton placeholders that match the team item layout */}
                  {[0, 1, 2].map((i) => (
                    <DropdownMenuItem asChild key={`skeleton-${i}`}>
                      <button
                        disabled
                        className={`flex items-center justify-between gap-2 p-2 rounded-md w-full text-left hover:bg-accent/30 pointer-events-none bg-transparent`}
                        aria-hidden
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-6 rounded-sm" />
                          <Skeleton className="h-4 w-28 rounded" />
                        </div>
                        <Skeleton className="h-4 w-4 rounded" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {myTeamsQuery.data?.teams?.map((team) => (
                <DropdownMenuItem asChild key={team.id}>
                  <button
                    className={`flex items-center justify-between gap-2 p-2 rounded-md w-full text-left hover:bg-accent/30 ${
                      user?.active_team_id === team.id ? "bg-accent/20" : ""
                    }`}
                    onClick={() => {
                      if (!user) return;
                      setUser({ ...user, active_team_id: team.id });
                      updateActiveTeam({
                        userId: user.id,
                        active_team_id: team.id,
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-sm bg-primary/20 flex items-center justify-center text-xs text-primary">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm truncate">{team.name}</div>
                    </div>
                    {user?.active_team_id === team.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                </DropdownMenuItem>
              ))}
            </div>
          </div>
          <DropdownMenuSeparator />

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
