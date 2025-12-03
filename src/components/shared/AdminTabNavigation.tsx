"use client";

import { cn } from "@/lib/utils";
import { Users, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminTabs = [
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Building2,
  },
];

export function AdminTabNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      {adminTabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
