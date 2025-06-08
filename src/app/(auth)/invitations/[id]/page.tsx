import AuthUiWrapper from "@/components/shared/AuthUiWrapper";
import { fetchUserInvitation } from "@/services/api/server/user.service";
import React from "react";
import InvitationForm from "./_components/InvitationForm";
import InvitationNotFound from "./_components/InvitationNotFound";

type PageProps = {
  params: { id: string };
};

const Page = async ({ params }: PageProps) => {
  const { id } = params;
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
