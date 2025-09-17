import React from "react";
import { usePathname } from "next/navigation";
import { GalleryIcon, HomeIcon } from "../ui/custom-icon";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { Users, BadgeInfo, ImageIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import NotificationHoverCard from "../notifications/NotificationHoverCard";

export const ICON_SIZE = 24;

const LINKS = [
  { name: "Home", icon: HomeIcon, path: "/", disabled: true },
  { name: "Gallery", icon: GalleryIcon, path: "/gallery" },
];

export function NavLinks() {
  const pathname = usePathname();
  const { user } = useUserStore();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isLarge = useMediaQuery("(min-width: 1024px)");

  const allLinks = [
    ...LINKS,
    {
      name: "Concept Visual",
      icon: ImageIcon,
      path: "/concept-visual",
      disabled: false,
    },

    ...(user?.role.id === "KK-ADMIN"
      ? [
          {
            name: "Users",
            icon: Users,
            path: "/users",
            disabled: false,
          },
        ]
      : []),
  ];

  return (
    <>
      {!isLarge ? (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex items-center justify-around px-4 py-2">
            {allLinks.slice(0, LINKS.length / 2).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={cn(
                    `flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]`,
                    {
                      "text-primary font-semibold":
                        isActive(link.path) && !link.disabled,
                    }
                  )}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={
                      isActive(link.path) && !link.disabled
                        ? "#636AE8"
                        : "#6e7787"
                    }
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <NotificationHoverCard />
            {allLinks.slice(LINKS.length / 2).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={cn(
                    `flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]`,
                    {
                      "text-primary font-semibold":
                        isActive(link.path) && !link.disabled,
                    }
                  )}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={
                      isActive(link.path) && !link.disabled
                        ? "#636AE8"
                        : "#6e7787"
                    }
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        <nav className="flex items-center justify-center flex-1">
          <div className="flex items-center space-x-8  md:space-x-16">
            {allLinks.slice(0, LINKS.length / 2).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={cn(
                    `flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]`,
                    {
                      "text-primary font-semibold":
                        isActive(link.path) && !link.disabled,
                    }
                  )}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={
                      isActive(link.path) && !link.disabled
                        ? "#636AE8"
                        : "#6e7787"
                    }
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <NotificationHoverCard />
            {allLinks.slice(LINKS.length / 2).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={cn(
                    `flex flex-col cursor-pointer gap-y-0.5 items-center text-xs text-[#6e7787]`,
                    {
                      "text-primary font-semibold":
                        isActive(link.path) && !link.disabled,
                    }
                  )}
                >
                  <Icon
                    size={ICON_SIZE}
                    color={
                      isActive(link.path) && !link.disabled
                        ? "#636AE8"
                        : "#6e7787"
                    }
                  />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
