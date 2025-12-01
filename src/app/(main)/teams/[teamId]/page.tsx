"use client";

import { useTeams } from "@/hooks/useTeams";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TeamEditForm } from "../_components/TeamEditForm";
import { TeamMembersSection } from "../_components/TeamMembersSection";
import { TeamBrandsSection } from "../_components/TeamBrandsSection";
import TeamLoadingSkeleton from "../_components/TeamLoadingSkeleton";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { teamQuery } = useTeams({ teamId });
  const { data: team, isLoading } = teamQuery;

  if (isLoading) {
    return (
      <TeamLoadingSkeleton />
    );
  }

  if (!team) {
    return (
      <div className="px-4 py-6">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">Team ID: {team.id}</p>
        </div>
      </div>

      {/* Team Details and Brands - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamEditForm team={team} />
        <TeamBrandsSection team={team} />
      </div>

      {/* Members Section - Full Width */}
      <TeamMembersSection team={team} />
    </div>
  );
}
