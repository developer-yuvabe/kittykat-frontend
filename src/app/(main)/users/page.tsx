"use client";

import { RoleProtected } from "@/components/shared/RoleProtected";
import { UsersTable } from "./_components/UsersTable";

const page = () => {
  return (
    <RoleProtected>
      <div className="px-4 flex w-full h-[calc(100vh-6.5rem)] overflow-hidden pt-2">
        <UsersTable />
      </div>
    </RoleProtected>
  );
};

export default page;
