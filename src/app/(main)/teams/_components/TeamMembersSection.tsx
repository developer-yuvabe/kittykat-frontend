"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserRoundPlus, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserMultiSelect,
  type SelectedUser,
} from "@/components/ui/user-multi-select";

import { useTeams } from "@/hooks/useTeams";
import { canManageTeam, isKKAdmin } from "@/lib/team.utils";
import { useUserStore } from "@/store/user.store";
import { TeamResponse, TeamRolesEnum } from "@/types/team.types";

import { InviteMemberDialog } from "./InviteMemberDialog";
import { MembersTable } from "./TeamMembersTable";

// ============================================================================
// Types
// ============================================================================
interface TeamMembersSectionProps {
  team: TeamResponse;
}

interface AddMemberRequest {
  id: string;
  role: TeamRolesEnum;
}

interface SelectedMemberWithRole extends SelectedUser {
  role: TeamRolesEnum;
}

// ============================================================================
// Component
// ============================================================================
export function TeamMembersSection({ team }: TeamMembersSectionProps) {
  const { user } = useUserStore();
  const {
    addMembers,
    removeMembers,
    updateMemberRole,
    isAddingMembers,
    isRemovingMembers,
    isUpdatingMemberRole,
  } = useTeams();

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    SelectedMemberWithRole[]
  >([]);

  // Permissions - simplified: canManage = owner/admin/kk-admin can do everything
  const canManage = canManageTeam(user, team);
  const canAddExistingMembers = isKKAdmin(user); // Only KK-ADMIN can add existing users

  // Get IDs of existing team members to exclude from the multi-select
  const existingMemberIds = team.members.map((m) => m.id);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    const membersToAdd: AddMemberRequest[] = selectedNewMembers.map((m) => ({
      id: m.id,
      role: m.role,
    }));

    toast.promise(
      new Promise<void>((resolve, reject) => {
        addMembers(
          { teamId: team.id, members: membersToAdd },
          {
            onSuccess: () => {
              setAddDialogOpen(false);
              setSelectedNewMembers([]);
              resolve();
            },
            onError: (error) => reject(error),
          }
        );
      }),
      {
        loading: "Adding members...",
        success: "Members added successfully!",
        error: "Failed to add members.",
      }
    );
  };

  const handleUserSelectionChange = (users: SelectedUser[]) => {
    // Map new users to include role, preserving existing roles
    const updatedMembers: SelectedMemberWithRole[] = users.map((user) => {
      const existing = selectedNewMembers.find((m) => m.id === user.id);
      return existing || { ...user, role: TeamRolesEnum.MEMBER };
    });
    setSelectedNewMembers(updatedMembers);
  };

  const handleRemoveMember = (memberId: string) => {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        removeMembers(
          { teamId: team.id, memberIds: [memberId] },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      }),
      {
        loading: "Removing member...",
        success: "Member removed successfully!",
        error: "Failed to remove member.",
      }
    );
  };

  const handleRoleChange = (memberId: string, newRole: TeamRolesEnum) => {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        updateMemberRole(
          { teamId: team.id, memberId, newRole },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        );
      }),
      {
        loading: "Updating role...",
        success: "Role updated successfully!",
        error: "Failed to update role.",
      }
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team.members.length})
            </CardTitle>
            <div className="flex flex-row gap-2">
              {canManage && (
                <Button
                  onClick={() => setInviteDialogOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <UserRoundPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
              {canAddExistingMembers && (
                <Button onClick={() => setAddDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Members
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={team.members}
            team={team}
            canManage={canManage}
            onRemove={handleRemoveMember}
            onRoleChange={handleRoleChange}
            isRemoving={isRemovingMembers}
            isUpdatingRole={isUpdatingMemberRole}
          />
        </CardContent>
      </Card>

      {/* Invite Member Dialog (New Flow) */}
      <InviteMemberDialog
        team={team}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      {/* Add Existing Members Dialog (Original Flow) */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Select users to add to the team and assign their roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <UserMultiSelect
              selectedUsers={selectedNewMembers}
              onSelectionChange={handleUserSelectionChange}
              excludeUserIds={existingMemberIds}
              placeholder="Search and select users to add..."
            />

            {selectedNewMembers.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Assign Roles:</p>
                <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                  {selectedNewMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-3 bg-background rounded-md border"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {member.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {member.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>
                      <Select
                        value={member.role}
                        onValueChange={(value) => {
                          setSelectedNewMembers((prev) =>
                            prev.map((m) =>
                              m.id === member.id
                                ? { ...m, role: value as TeamRolesEnum }
                                : m
                            )
                          );
                        }}
                      >
                        <SelectTrigger className="w-32 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TeamRolesEnum.ADMIN}>
                            Admin
                          </SelectItem>
                          <SelectItem value={TeamRolesEnum.MEMBER}>
                            Member
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setSelectedNewMembers([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMembers} disabled={isAddingMembers}>
              {isAddingMembers ? "Adding..." : "Add Members"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
