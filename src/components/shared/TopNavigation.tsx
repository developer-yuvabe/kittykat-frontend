import { LogoSection } from "./LogoSection";
import { NavLinks } from "./NavLinks";
import { UserProfileMenu } from "./UserProfileMenu";

export function TopNavigation() {
  return (
    <div className="w-full h-24 px-4 flex items-center justify-between  border-[#f3f4f6] bg-white sticky top-0 z-10">
      <LogoSection />
      <NavLinks />
      <UserProfileMenu />
    </div>
  );
}
