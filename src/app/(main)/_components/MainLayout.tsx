"use client";

import Splash from "@/components/shared/Splash";
import { TopNavigation } from "@/components/shared/TopNavigation";
import VerifyEmailModal from "@/components/shared/VerifyEmailModal";
import { auth } from "@/config/firebase.config";
import { StreamProvider } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/user.types";
import { User as FirebaeUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";

const MainLayout = ({
  user: userProfile,
  children,
}: {
  children: React.ReactNode;
  user: User;
}) => {
  const { setUser } = useUserStore();
  const [firebaseUser, setFirebaseUser] = useState<FirebaeUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setUser({
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      thread_id: userProfile.thread_id,
      role: userProfile.role,
      is_default_admin: userProfile.is_default_admin,
    });
  }, [userProfile]);

  if (!userProfile || !firebaseUser) {
    return <Splash />;
  }

  return (
    <StreamProvider>
      <main>
        <TopNavigation />
        {children}

        {/* Verify Email Modal */}
        {!firebaseUser.emailVerified && (
          <VerifyEmailModal
            email={userProfile.email}
            setFirebaseUser={(u) => setFirebaseUser(u)}
          />
        )}
      </main>
    </StreamProvider>
  );
};

export default MainLayout;
