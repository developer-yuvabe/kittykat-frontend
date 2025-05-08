"use client";

import { KittyKatInterface } from "./_components/KittykatInterface";

export default function Page() {
  return (
    <div className="bg-white">
      <KittyKatInterface />
      {/* {user?.email}
      <Button onClick={handleLogout}>Logout</Button> */}
    </div>
  );
}
