"use client";

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
} from "@/lib/team.utils";
import { useUserStore } from "@/store/user.store";
import {  TeamResponse, TeamRolesEnum } from "@/types/team.types";
import {  Plus, Users } from "lucide-react";
import {  useState } from "react";
import { toast } from "sonner";
import { MembersTable } from "./TeamMembersTable";


interface TeamMembersSectionProps {
  team: TeamResponse;
}

interface AddMemberRequest {
  id: string;
  role: TeamRolesEnum;
}


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

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<
    AddMemberRequest[]
  >([]);

  const canAdd = canAddMembers(user);
  const canRemove = canRemoveMembers(user, team);
  const canChangeRole = canChangeRoles(user);

  const selectedMemberIds = selectedNewMembers.map((m) => m.id);

  const handleAddMembers = () => {
    if (selectedNewMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    toast.promise(
      new Promise<void>((resolve, reject) => {
        addMembers(
          { teamId: team.id, members: selectedNewMembers },
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
          <MembersTable
            members={team.members}
            team={team}
            canChangeRole={canChangeRole}
            canRemove={canRemove}
            onRemove={handleRemoveMember}
            onRoleChange={handleRoleChange}
            isRemoving={isRemovingMembers}
            isUpdatingRole={isUpdatingMemberRole}
          />
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
                  placeholder="Select users to add..."
                />
              </MultiSelectTrigger>
              <MultiSelectContent
                search={{
                  placeholder: "Search users...",
                  emptyMessage: "No available users",
                }}
              >
                <MultiSelectGroup>
                  {team.members.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No more users to add
                    </div>
                  ) : (
                    team.members.map((user) => (
                      <MultiSelectItem
                        key={user.id}
                        value={user.id}
                        badgeLabel={user.name}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="break-words text-sm">
                              {user.name}
                            </span>
                            <span className="italic text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </MultiSelectItem>
                    ))
                  )}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>

            {selectedNewMembers.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Assign Roles:</p>
                <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                  {selectedNewMembers.map((member) => {
                    const user = team.members.find((u) => u.id === member.id);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 p-3 bg-background rounded-md border"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {user?.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {user?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user?.email}
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
