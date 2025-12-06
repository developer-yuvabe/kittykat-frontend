"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useTeams } from "@/hooks/useTeams";
import { TeamBrand, TeamResponse } from "@/types/team.types";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TeamBrandsBadge } from "./TeamBrandsBadge";
import { TeamBrandsAllAccessBadge } from "./TeamBrandsAllAccessBadge";

interface TeamBrandsRemoveOnlySectionProps {
  team: TeamResponse;
}

export function TeamBrandsRemoveOnlySection({
  team,
}: TeamBrandsRemoveOnlySectionProps) {
  const { updateTeam, isUpdatingTeam } = useTeams();
  const [brandToRemove, setBrandToRemove] = useState<TeamBrand | null>(null);

  const brandCountDisplay = team.has_all_brands_access
    ? "All"
    : team.accessible_brands?.length || 0;

  const handleRemoveBrand = () => {
    if (!brandToRemove) return;

    const updatedBrands =
      team.accessible_brands
        ?.filter((b) => b.id !== brandToRemove.id)
        .map((b) => b.id) || [];

    toast.promise(
      new Promise((resolve, reject) => {
        updateTeam(
          {
            teamId: team.id,
            payload: {
              accessible_brands: updatedBrands,
            },
          },
          {
            onSuccess: () => {
              setBrandToRemove(null);
              resolve(true);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      }),
      {
        loading: `Removing ${brandToRemove.name}...`,
        success: `${brandToRemove.name} removed from team`,
        error: "Failed to remove brand",
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Brand Access ({brandCountDisplay})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {team.has_all_brands_access ? (
            <TeamBrandsAllAccessBadge />
          ) : team.accessible_brands && team.accessible_brands.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {team.accessible_brands.map((brand) => (
                <TeamBrandsBadge
                  key={brand.id}
                  brand={brand}
                  onRemove={() => setBrandToRemove(brand)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No brands assigned yet.
            </p>
          )}
        </CardContent>
      </Card>

      <ReusableAlertDialog
        open={!!brandToRemove}
        onOpenChange={(open) => !open && setBrandToRemove(null)}
        title="Remove Brand"
        description={
          <>
            Are you sure you want to remove{" "}
            <strong>&quot;{brandToRemove?.name}&quot;</strong> from this team?
          </>
        }
        confirmLabel="Remove"
        onConfirm={handleRemoveBrand}
        isLoading={isUpdatingTeam}
        danger
      />
    </>
  );
}
