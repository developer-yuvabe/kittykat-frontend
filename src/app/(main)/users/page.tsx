"use client";

import { AdminProtected } from "@/components/shared/AdminProtected";
import { UsersTable } from "./_components/UsersTable";

const page = () => {
  return (
    <AdminProtected>
      <div className="px-4 flex w-full h-[calc(100vh-6.5rem)] overflow-hidden pt-2">
        <UsersTable />
      </div>
    </AdminProtected>
  );
};

export default page;
