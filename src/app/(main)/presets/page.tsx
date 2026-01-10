"use client";

import { RoleProtected } from "@/components/shared/RoleProtected";
import { UserRoleId } from "@/types/user.types";
import { PresetListTable } from "./_components/PresetListTable";

export default function PresetsPage() {
  return (
    <RoleProtected
      allowedRoles={[UserRoleId.ADMIN, UserRoleId.KK_CREATIVE_USER]}
    >
      <div className="h-full flex flex-col p-6">
        <PresetListTable />
      </div>
    </RoleProtected>
  );
}
