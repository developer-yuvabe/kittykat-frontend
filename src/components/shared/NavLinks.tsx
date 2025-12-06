// components/navigation/NavLinks.tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn, filterLinksByRole, NAVIGATION_LINKS } from "@/lib/utils";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useUserStore } from "@/store/user.store";
import { Image } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import NotificationHoverCard from "../notifications/NotificationHoverCard";
import { UserRoleId } from "@/types/user.types";

export const ICON_SIZE = 24;
const ACTIVE_COLOR = "#636AE8";
const INACTIVE_COLOR = "#6e7787";

export function NavLinks() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { openConceptVisual } = useConceptVisualStore();
  const isLarge = useMediaQuery("(min-width: 1024px)");

  const userRole = user?.role.id as UserRoleId | undefined;

  const visibleLinks = useMemo(
    () => filterLinksByRole(NAVIGATION_LINKS, userRole),
    [userRole]
  );

  const isActive = (path: string) => pathname === path;

  const renderNavLink = (link: (typeof NAVIGATION_LINKS)[0]) => {
    const Icon = link.icon;
    const active = isActive(link.path) && !link.disabled;

    return (
      <Link
        key={link.name}
        href={link.path}
        className={cn(
          "flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]",
          {
            "text-primary font-semibold": active,
          }
        )}
      >
        <Icon size={ICON_SIZE} color={active ? ACTIVE_COLOR : INACTIVE_COLOR} />
        <span>{link.name}</span>
      </Link>
    );
  };

  const renderVisualEditor = () => (
    <div
      onClick={() =>
        openConceptVisual({
          source: "blanket",
          assetItems: [],
          asset: null,
        })
      }
      className={cn(
        "flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]",
        isLarge && "hover:text-primary"
      )}
    >
      <Image size={ICON_SIZE} color={INACTIVE_COLOR} />
      <span>Visual Editor</span>
    </div>
  );

  // Split links: first link, then Notification (2nd), then Visual Editor, then rest
  const firstLink = visibleLinks.slice(0, 1);
  const restLinks = visibleLinks.slice(1);

  if (!isLarge) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-4 py-2">
          {firstLink.map(renderNavLink)}
          <NotificationHoverCard />
          {renderVisualEditor()}
          {restLinks.map(renderNavLink)}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-center flex-1">
      <div className="flex items-center space-x-8 md:space-x-16">
        {firstLink.map(renderNavLink)}
        <NotificationHoverCard />
        {renderVisualEditor()}
        {restLinks.map(renderNavLink)}
      </div>
    </nav>
  );
}
