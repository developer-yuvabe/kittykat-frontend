"use client";

import { TeamBrand } from "@/types/team.types";
import { TeamBrandsBadge } from "./TeamBrandsBadge";
import { TeamBrandsAllAccessBadge } from "./TeamBrandsAllAccessBadge";

interface TeamBrandsReadOnlyViewProps {
  brands: TeamBrand[];
  hasAllBrandsAccess?: boolean;
}

export function TeamBrandsReadOnlyView({
  brands,
  hasAllBrandsAccess,
}: TeamBrandsReadOnlyViewProps) {
  if (hasAllBrandsAccess) {
    return <TeamBrandsAllAccessBadge />;
  }

  if (brands.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No brands assigned yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {brands.map((brand) => (
        <TeamBrandsBadge key={brand.id} brand={brand} />
      ))}
    </div>
  );
}
