"use client";

import { ReactNode } from "react";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

interface AdminProtectedComponentProps {
  children: ReactNode;
}

export function AdminProtectedComponent({
  children,
}: AdminProtectedComponentProps) {
  const { user } = useUserStore();

  if (!user || user.role.id !== UserRoleId.ADMIN) {
    return null;
  }

  return <>{children}</>;
}
