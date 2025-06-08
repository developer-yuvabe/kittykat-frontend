import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import { fetchUserInvitation } from "@/services/api/server/user.service";
import React from "react";
import InvitationForm from "./_components/InvitationForm";
import InvitationNotFound from "./_components/InvitationNotFound";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const invitation = await fetchUserInvitation(id);

  return (
    <AuthUiWrapper>
      {invitation ? (
        <InvitationForm email={invitation.email} invitationId={invitation.id} />
      ) : (
        <InvitationNotFound />
      )}
    </AuthUiWrapper>
  );
};

export default Page;
