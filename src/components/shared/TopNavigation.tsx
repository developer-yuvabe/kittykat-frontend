import React from "react";
import { LogoSection } from "./LogoSection";
import { NavLinks } from "./NavLinks";
import { UserProfileMenu } from "./UserProfileMenu";

export function TopNavigation() {
  return (
    <div className="w-full h-24 px-4 flex items-center justify-between bg-white sticky top-0 z-40 border-b">
      <LogoSection />
      <NavLinks />
      <UserProfileMenu />
    </div>
  );
}
