"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Users, XCircle, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  useInvitation,
  useTeamInvitationValidation,
} from "@/hooks/useInvitation";
import { TeamInvitationStatus } from "@/services/api/invitation.service";

// ============================================================================
// Types
// ============================================================================
type AcceptState =
  | "loading"
  | "confirming"
  | "accepting"
  | "success"
  | "already_member"
  | "not_found"
  | "error";

// ============================================================================
// Component
// ============================================================================
export default function AcceptTeamInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [state, setState] = useState<AcceptState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { acceptTeamInvitation, isAcceptingTeamInvitation } = useInvitation();
  const { validation, isValidating, validationError, status, teamName } =
    useTeamInvitationValidation({ teamId });

  // Determine state based on validation result
  useEffect(() => {
    if (isValidating) {
      setState("loading");
      return;
    }

    if (validationError) {
      setState("error");
      setErrorMessage("Failed to validate invitation. Please try again.");
      return;
    }

    if (!validation) {
      setState("loading");
      return;
    }

    // Check the validation status
    switch (status) {
      case TeamInvitationStatus.INVITED:
        setState("confirming");
        break;
      case TeamInvitationStatus.ACTIVE:
        setState("already_member");
        break;
      case TeamInvitationStatus.NOT_FOUND:
        setState("not_found");
        setErrorMessage(
          "No invitation found. You may not have been invited to this team."
        );
        break;
      case TeamInvitationStatus.TEAM_NOT_FOUND:
        setState("error");
        setErrorMessage("Team not found. The team may have been deleted.");
        break;
      default:
        setState("error");
        setErrorMessage("Unable to validate invitation.");
    }
  }, [isValidating, validation, validationError, status]);

  const handleAccept = async () => {
    setState("accepting");

    try {
      await acceptTeamInvitation(teamId);
      setState("success");
      toast.success(`You have joined ${teamName}!`);
    } catch (error) {
      setState("error");
      const message =
        error instanceof Error
          ? error.message
          : "Failed to accept invitation. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  const handleGoToTeam = () => {
    router.push(`/teams/${teamId}`);
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // -------------------------------------------------------------------------
  // Render States
  // -------------------------------------------------------------------------

  // Loading state
  if (state === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already a member state
  if (state === "already_member") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle>Already a Member</CardTitle>
            <CardDescription>
              You are already an active member of{" "}
              <span className="font-medium">{teamName}</span>.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleGoToTeam}>Go to Team</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Not found state (no invitation)
  if (state === "not_found" || state === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <XCircle className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleGoHome}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state
  if (state === "success") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle>Welcome to {teamName}!</CardTitle>
            <CardDescription>
              You have successfully joined the team. You can now collaborate
              with other team members.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleGoToTeam}>Go to Team</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Confirming state (default - valid invitation)
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {teamName}</CardTitle>
          <CardDescription>
            You have been invited to join this team. Accept the invitation to
            start collaborating with team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {teamName?.charAt(0).toUpperCase() || "T"}
              </div>
              <div>
                <p className="font-medium">{teamName}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={isAcceptingTeamInvitation}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isAcceptingTeamInvitation}
          >
            {isAcceptingTeamInvitation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              "Accept & Join"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
