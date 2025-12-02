"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInvitation } from "@/hooks/useInvitation";
import {
  teamInvitationFormSchema,
  type TeamInvitationFormInput,
} from "@/schema/inviation.schema";
import { TeamRolesEnum, type TeamResponse } from "@/types/team.types";

// ============================================================================
// Types
// ============================================================================
interface InviteMemberDialogProps {
  team: TeamResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InviteResultState {
  email: string;
  status: "invited";
  invitationLink?: string;
  isExistingUser: boolean;
}

// ============================================================================
// Component
// ============================================================================
export function InviteMemberDialog({
  team,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { inviteToTeam, isInvitingToTeam } = useInvitation();
  const [inviteResult, setInviteResult] = useState<InviteResultState | null>(
    null
  );

  const form = useForm<TeamInvitationFormInput>({
    resolver: zodResolver(teamInvitationFormSchema),
    defaultValues: {
      email: "",
      teamRole: TeamRolesEnum.MEMBER,
    },
  });

  const handleSubmit = async (data: TeamInvitationFormInput) => {
    try {
      const result = await inviteToTeam({
        email: data.email,
        teamId: team.id,
        teamRole: data.teamRole,
      });

      // Determine if existing user based on invitation_link format
      const isExistingUser =
        result.invitation_link?.includes("/teams/") ?? false;

      setInviteResult({
        email: data.email,
        status: "invited",
        invitationLink: result.invitation_link,
        isExistingUser,
      });

      toast.success(
        isExistingUser
          ? "Invitation sent to existing user"
          : "Invitation email sent to new user"
      );

      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    form.reset();
    setInviteResult(null);
    onOpenChange(false);
  };

  const handleInviteAnother = () => {
    setInviteResult(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Member to {team.name}
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to this team.
          </DialogDescription>
        </DialogHeader>

        {inviteResult ? (
          // Success State
          <div className="py-6 space-y-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                {inviteResult.isExistingUser ? (
                  <>
                    <span className="font-medium">{inviteResult.email}</span> is
                    an existing platform user. They have been sent an invitation
                    to join this team.
                  </>
                ) : (
                  <>
                    An invitation has been sent to{" "}
                    <span className="font-medium">{inviteResult.email}</span>.
                    They will receive an email to create their account and join
                    this team.
                  </>
                )}
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              <Button onClick={handleInviteAnother}>Invite Another</Button>
            </DialogFooter>
          </div>
        ) : (
          // Form State
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TeamRolesEnum.MEMBER}>
                          <div className="flex flex-col items-start">
                            <span>Member</span>
                            <span className="text-xs text-muted-foreground">
                              Can view and collaborate on team projects
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value={TeamRolesEnum.ADMIN}>
                          <div className="flex flex-col items-start">
                            <span>Admin</span>
                            <span className="text-xs text-muted-foreground">
                              Can manage team settings and members
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isInvitingToTeam}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isInvitingToTeam}>
                  {isInvitingToTeam ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
