"use client";

import { useTeams } from "@/hooks/useTeams";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TeamEditForm } from "../_components/TeamEditForm";
import { TeamMembersSection } from "../_components/TeamMembersSection";
import { TeamBrandsSection } from "../_components/TeamBrandsSection";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { teamQuery } = useTeams({ teamId });
  const { data: team, isLoading } = teamQuery;

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
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
    <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
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
          <p className="text-sm text-muted-foreground">
            Team ID: {team.id}
          </p>
        </div>
      </div>

      {/* Team Details Form */}
      <TeamEditForm team={team} />

      {/* Members Section */}
      <TeamMembersSection team={team} />

      {/* Brands Section */}
      <TeamBrandsSection team={team} />
    </div>
  );
}
