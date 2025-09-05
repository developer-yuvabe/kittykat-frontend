import React from "react";
import { LogoSection } from "./LogoSection";
import { NavLinks } from "./NavLinks";
import { UserProfileMenu } from "./UserProfileMenu";
import { useModelsStore } from "@/store/models.store";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "@/services/api/models.service";

export function TopNavigation() {
  const { setModels, setIsModelsFetched } = useModelsStore();
  useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      try {
        const fetchedModels = await getModels();
        setModels(fetchedModels);
        return fetchedModels;
      } finally {
        setIsModelsFetched(true);
      }
    },
  });

  return (
    <div className="w-full h-24 px-4 flex items-center justify-between bg-white sticky top-0 z-40 border-b">
      <LogoSection />
      <NavLinks />
      <UserProfileMenu />
    </div>
  );
}
