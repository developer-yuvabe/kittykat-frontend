"use client";

import { AppConfig } from "@/config/app.config";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AdminProtectedProps {
  children: ReactNode;
}

export function AdminProtected({ children }: AdminProtectedProps) {
  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role.id !== UserRoleId.ADMIN) {
      router.push(AppConfig.HOME_ROUTE);
    }
  }, [user, router]);

  if (!user || user.role.id !== UserRoleId.ADMIN) {
    return (
      <div className="flex items-center justify-center w-full h-[85vh]">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
