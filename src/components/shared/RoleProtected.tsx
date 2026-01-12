"use client";

import { AppConfig } from "@/config/app.config";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface RoleProtectedProps {
  children: ReactNode;
  allowedRoles?: UserRoleId[];
}

export function RoleProtected({
  children,
  allowedRoles = [UserRoleId.ADMIN],
}: RoleProtectedProps) {
  const { user } = useUserStore();
  const router = useRouter();

  const hasAccess = user && allowedRoles.includes(user.role.id);

  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role.id)) {
      router.push(AppConfig.HOME_ROUTE);
    }
  }, [user, router, allowedRoles]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center w-full h-[85vh]">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
