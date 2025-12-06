"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canEditTeamDetails, canManageTeam } from "@/lib/team.utils";
import { useUserStore } from "@/store/user.store";
import { TeamResponse } from "@/types/team.types";
import { Briefcase } from "lucide-react";
import { TeamBrandsEditableSection } from "./TeamBrandsEditableSection";
import { TeamBrandsRemoveOnlySection } from "./TeamBrandsRemoveOnlySection";
import { TeamBrandsReadOnlyView } from "./TeamBrandsReadOnlyView";

interface TeamBrandsSectionProps {
  team: TeamResponse;
}

export function TeamBrandsSection({ team }: TeamBrandsSectionProps) {
  const { user: currentUser } = useUserStore();
  const canFullyEdit = canEditTeamDetails(currentUser);
  const canRemoveBrands = canManageTeam(currentUser, team);

  // Determine brand count display
  const brandCountDisplay = team.has_all_brands_access
    ? "All"
    : team.accessible_brands?.length || 0;

  // KK-ADMIN: Full edit access (add/remove brands, toggle all brands)
  if (canFullyEdit) {
    return <TeamBrandsEditableSection team={team} currentUser={currentUser!} />;
  }

  // Team Owner/Admin: Can only remove existing brands
  if (canRemoveBrands) {
    return <TeamBrandsRemoveOnlySection team={team} />;
  }

  // Others: Read-only view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Brand Access ({brandCountDisplay})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TeamBrandsReadOnlyView
          brands={team.accessible_brands || []}
          hasAllBrandsAccess={team.has_all_brands_access}
        />
      </CardContent>
    </Card>
  );
}
