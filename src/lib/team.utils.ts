import { TeamResponse, TeamRolesEnum, TeamMember } from "@/types/team.types";
import { User, UserRoleId } from "@/types/user.types";

/**
 * Check if the current user is a KK-ADMIN
 */
export function isKKAdmin(user: User | null): boolean {
  return user?.role.id === UserRoleId.ADMIN;
}

/**
 * Check if the current user is the owner of the team
 */
export function isTeamOwner(
  user: User | null,
  team: TeamResponse | null
): boolean {
  if (!user || !team) return false;
  return team.owner.id === user.id;
}

/**
 * Check if the current user is a team admin (has TEAM-ADMIN role)
 */
export function isTeamAdmin(
  user: User | null,
  team: TeamResponse | null
): boolean {
  if (!user || !team) return false;
  const member = team.members.find((m) => m.id === user.id);
  return member?.role === TeamRolesEnum.ADMIN;
}

/**
 * Check if the current user can edit team details (name, credits, tokens)
 * Only KK-ADMIN can edit
 */
export function canEditTeamDetails(user: User | null): boolean {
  return isKKAdmin(user);
}

/**
 * Check if the current user can add members to the team
 * Only KK-ADMIN can add members
 */
export function canAddMembers(user: User | null): boolean {
  return isKKAdmin(user);
}

/**
 * Check if the current user can remove members from the team
 * KK-ADMIN or team OWNER/ADMIN can remove members
 */
export function canRemoveMembers(
  user: User | null,
  team: TeamResponse | null
): boolean {
  if (!user || !team) return false;
  return isKKAdmin(user) || isTeamOwner(user, team) || isTeamAdmin(user, team);
}

/**
 * Check if the current user can change member roles
 * Only KK-ADMIN can change roles
 */
export function canChangeRoles(user: User | null): boolean {
  return isKKAdmin(user);
}

/**
 * Check if the current user can delete the team
 * Only KK-ADMIN can delete teams
 */
export function canDeleteTeam(user: User | null): boolean {
  return isKKAdmin(user);
}

/**
 * Format team role for display
 */
export function formatTeamRole(role?: TeamRolesEnum): string {
  if (!role) return "Member";

  switch (role) {
    case TeamRolesEnum.OWNER:
      return "Owner";
    case TeamRolesEnum.ADMIN:
      return "Admin";
    case TeamRolesEnum.MEMBER:
      return "Member";
    default:
      return "Member";
  }
}

/**
 * Get team member by user ID
 */
export function getTeamMember(
  team: TeamResponse | null,
  userId: string
): TeamMember | undefined {
  if (!team) return undefined;
  return team.members.find((m) => m.id === userId);
}

/**
 * Get role badge color based on role
 */
export function getRoleBadgeVariant(
  role?: TeamRolesEnum
): "default" | "secondary" | "destructive" | "outline" {
  if (!role) return "secondary";

  switch (role) {
    case TeamRolesEnum.OWNER:
      return "default";
    case TeamRolesEnum.ADMIN:
      return "outline";
    case TeamRolesEnum.MEMBER:
      return "secondary";
    default:
      return "secondary";
  }
}
