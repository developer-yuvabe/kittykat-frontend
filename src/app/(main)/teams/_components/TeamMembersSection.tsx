"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeams } from "@/hooks/useTeams";
import {
  canAddMembers,
  canChangeRoles,
  canRemoveMembers,
  formatTeamRole,
  getRoleBadgeVariant,
} from "@/lib/team.utils";
import { fetchAllUsers } from "@/services/api/user.service";
import { useUserStore } from "@/store/user.store";
import { TeamResponse, TeamRolesEnum } from "@/types/team.types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TeamMembersSectionProps {
  team: TeamResponse;
}

interface MemberWithRole {
  id: string;
  role: TeamRolesEnum;
}

export function TeamMembersSection({ team }: TeamMembersSectionProps) {
  const { user } = useUserStore();
  const { addMembers, removeMembers, isAddingMembers, isRemovingMembers } =
    useTeams();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    MemberWithRole[]
  >([]);

  const canAdd = canAddMembers(user);
  const canRemove = canRemoveMembers(user, team);
  const canChangeRole = canChangeRoles(user);

  // Fetch all users for member selection
  const { data: usersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => fetchAllUsers(1, 50),
    enabled: addDialogOpen,
  });

  const users = usersData?.users || [];
  const existingMemberIds = team.members.map((m) => m.id);
  const availableUsers = users.filter((u) => !existingMemberIds.includes(u.id));

  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        addMembers(
          { teamId: team.id, members: selectedNewMembers },
          {
            onSuccess: () => {
              setAddDialogOpen(false);
              setSelectedNewMembers([]);
              resolve(true);
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

  const handleRemoveMember = (memberId: string) => {
    toast.promise(
      new Promise((resolve, reject) => {
        removeMembers(
          { teamId: team.id, memberIds: [memberId] },
          {
            onSuccess: () => resolve(true),
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
    // Update member role by removing and re-adding with new role
    const member = team.members.find((m) => m.id === memberId);
    if (!member) return;

    toast.promise(
      new Promise((resolve, reject) => {
        // First remove the member
        removeMembers(
          { teamId: team.id, memberIds: [memberId] },
          {
            onSuccess: () => {
              // Then add them back with new role
              addMembers(
                { teamId: team.id, members: [{ id: memberId, role: newRole }] },
                {
                  onSuccess: () => resolve(true),
                  onError: (error) => reject(error),
                }
              );
            },
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

  const selectedMemberIds = selectedNewMembers.map((m) => m.id);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team.members.length})
            </CardTitle>
            {canAdd && (
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => {
              const isOwner = member.id === team.owner.id;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {member.name || "Unknown User"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canChangeRole && !isOwner ? (
                      <Select
                        value={member.role || TeamRolesEnum.MEMBER}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value as TeamRolesEnum)
                        }
                      >
                        <SelectTrigger className="w-32">
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
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {formatTeamRole(member.role)}
                      </Badge>
                    )}
                    {canRemove && !isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isRemovingMembers}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Members Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Select users to add to the team and assign their roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MultiSelect
              values={selectedMemberIds}
              onValuesChange={(values) => {
                const newMembers = values.map((userId) => {
                  const existing = selectedNewMembers.find(
                    (m) => m.id === userId
                  );
                  return existing || { id: userId, role: TeamRolesEnum.MEMBER };
                });
                setSelectedNewMembers(newMembers);
              }}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  overflowBehavior="cutoff"
                  placeholder="Select users"
                />
              </MultiSelectTrigger>
              <MultiSelectContent
                search={{
                  placeholder: "Search users...",
                  emptyMessage: "No users found",
                }}
              >
                <MultiSelectGroup>
                  {availableUsers.map((user) => (
                    <MultiSelectItem
                      key={user.id}
                      value={user.id}
                      badgeLabel={user.name}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="break-words">{user.name}</span>
                          <span className="italic text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>

            {selectedNewMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Assign Roles:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                  {selectedNewMembers.map((member) => {
                    const user = users.find((u) => u.id === member.id);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {user?.name || "Unknown"}
                          </span>
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
                          <SelectTrigger className="w-32">
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
                    );
                  })}
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
