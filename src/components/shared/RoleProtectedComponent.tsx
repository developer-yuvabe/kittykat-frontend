"use client";

import { ReactNode } from "react";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

interface RoleProtectedComponentProps {
  children: ReactNode;
  allowedRoles?: UserRoleId[];
}

export function RoleProtectedComponent({
  children,
  allowedRoles = [UserRoleId.ADMIN],
}: RoleProtectedComponentProps) {
  const { user } = useUserStore();

  if (!user || !allowedRoles.includes(user.role.id)) {
    return null;
  }

  return <>{children}</>;
}
