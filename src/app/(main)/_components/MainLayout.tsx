"use client";

import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import VerifyEmailModal from "@/components/shared/VerifyEmailModal";
import { StreamProvider } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/user.types";
import { DecodedIdToken } from "next-firebase-auth-edge/auth";
import React, { useEffect } from "react";

const MainLayout = ({
  user: userProfile,
  session,
  children,
}: {
  children: React.ReactNode;
  user: User;
  session: DecodedIdToken;
}) => {
  const { setUser } = useUserStore();

  const isEmailVerified = session.email_verified;
  console.log(userProfile.email, "email's verified:", isEmailVerified);

  useEffect(() => {
    setUser({
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      thread_id: userProfile.thread_id,
      role: userProfile.role,
      is_default_admin: userProfile.is_default_admin,
    });
  }, [userProfile, session]);

  if (!userProfile) {
    return <Splash />;
  }

  return (
    <StreamProvider>
      <main>
        <TopNavigation />
        {children}

        {/* Verify Email Modal */}
        {!isEmailVerified && <VerifyEmailModal email={userProfile.email} />}
      </main>
    </StreamProvider>
  );
};

export default MainLayout;
